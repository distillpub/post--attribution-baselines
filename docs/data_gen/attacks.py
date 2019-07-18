import numpy as np
import tensorflow as tf
from tqdm import tqdm

class IntegratedGradientsAttack(object):
    def __init__(self, model, k_top=1000, target_map=None, eps=0.03, background_samples=None):
        self.model = model
        self.model.saliency_op = tf.abs(tf.reduce_sum(self.model.expected_grads_op, axis=-1))
        self.k_top = k_top
        self.target_map = target_map
        self.eps = eps
        self.background_samples = background_samples
        self.center_of_mass = self._center_of_mass()
    
    def _center_of_mass(self):
        shape_list = self.model.images_pl.get_shape().as_list()
        h = shape_list[1]
        w = shape_list[2]
        
        y_mesh, x_mesh = np.meshgrid(np.arange(h), np.arange(w))
        return tf.stack([tf.reduce_sum(self.model.saliency_op * x_mesh)/(w * h),tf.reduce_sum(self.model.saliency_op * y_mesh)/(w * h)])
    
    def _perturbation(self, sess, image, attack_method):
        feed_dict = {self.model.train_eg: True, self.model.images_pl: image}
        if self.background_samples is not None:
            feed_dict[self.model.background_ref_pl] = self.background_samples
        
        shape_list = self.model.images_pl.get_shape().as_list()
        w, h, c = shape_list[1:]
        if attack_method == 'random':
            perturbation = np.random.normal(size=(1, w, h, c))
        elif attack_method == 'top_k':
            perturbation = sess.run(self.top_k_direction, feed_dict=feed_dict)
            perturbation = np.reshape(perturbation, [1, w, h, c])
        elif attack_method == 'mass_center':
            perturbation = sess.run(self.mass_center_direction, feed_dict=feed_dict)
            perturbation = np.reshape(perturbation, [1, w, h, c])
        elif attack_method == "target":
            if self.target_map is None:
                raise ValueError("attack_method set to `target` but target_map was unspecified.")
            else:
                perturbation = sess.run(self.target_direction, feed_dict=feed_dict)
                perturbation = np.reshape(perturbation, [1, w, h, c])
        return perturbation
    
    def _apply_perturbation(self, sess, image, base_image, alpha, attack_method):
        perturbed_image = image + self._perturbation(sess, image, attack_method)    
        perturbed_image = np.clip(perturbed_image, base_image + self.eps, base_image - self.eps)
        return perturbed_image
    
    def create_losses(self, sess):
        top_val, top_index = tf.nn.top_k(tf.reshape(self.model.saliency_op, [-1]), self.k_top)
        self.top_index = top_index
        self.top_k_loss = tf.reduce_sum(top_val)
        self.top_k_direction = -tf.gradients(self.top_k_loss, self.model.images_pl)[0]
        
        self.initial_mass_center = sess.run(self.center_of_mass)
        self.mass_center_loss = -tf.reduce_sum(tf.square(self.center_of_mass - self.initial_mass_center))
        self.mass_center_direction = -tf.gradients(self.mass_center_loss, self.model.images_pl)[0]
        
        if self.target_map is not None:
            self.target_loss = -tf.reduce_sum(self.model.saliency_op * self.target_map)
            self.target_direction = -tf.gradients(self.target_loss, self.model.images_pl)[0]
    
    def _attack_metric(self, sess, base_image, perturbed_image):
        base_top_k = sess.run(self.top_index, feed_dict={self.model.images_pl: base_image,
                                                                    self.model.train_eg: True})
        perturbed_top_k = sess.run(self.top_index, feed_dict={self.model.images_pl: perturbed_image,
                                                                         self.model.train_eg: True})
        return float(len(np.intersect1d(base_top_k, perturbed_top_k))) / self.k_top
        
    
    def iterative_attack(self, sess, image, attack_method, iters=300, alpha=0.5):
        base_image = image.copy()
        perturbed_image = image.copy()
        base_label = sess.run(self.model.pred_labels, feed_dict={self.model.images_pl: base_image})
        
        best_metric = np.inf
        best_image = perturbed_image
        
        for i in tqdm(range(iters)):
            perturbed_image = self._apply_perturbation(sess, perturbed_image, base_image, alpha, attack_method)
            perturbed_label = sess.run(self.model.pred_labels, feed_dict={self.model.images_pl: perturbed_image})
            if perturbed_label[0] != base_label[0]:
                print('Stopping at iteration {} as the predicted label has changed.')
                break
            current_metric = self._attack_metric(sess, base_image, perturbed_image)
            if current_metric < best_metric:
                current_metric = best_metric
                best_image = perturbed_image
        return best_image, best_metric