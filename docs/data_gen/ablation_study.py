import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import tensorflow as tf
import numpy as np
import altair as alt
import pandas as pd
import matplotlib.pyplot as plt
from get_network import get_model, normalize
from ig_pipeline import norm_clip
from tqdm import tqdm
from scipy import special
import scipy.misc
import json
import shap
import ops
import utils

from absl import app
from absl import flags

FLAGS = flags.FLAGS
flags.DEFINE_string('ablation_type', 'mean', 'One of `mean`, `blur`, `mean_center`, `blur_center`')
flags.DEFINE_string('saliency_type', 'eg', 'One of `eg`, `blur`, `gaussian`, `uniform`, `ig`, `max_dist`, `null_gaussian`')
flags.DEFINE_integer('num_samples', 1000, 'Number of samples to average over')
flags.DEFINE_boolean('save_examples', False, 'Set to true to save examples of ablation images')
flags.DEFINE_boolean('run_everything', False, 'Set to true to run all possible experiments in this file')

def save_ablation_examples(model, sess, images, labels, delta_pl, grad_op, grad_input_op):
    baseline_image = np.load('data/ignored/reference_images.npy')
    k_vals = np.linspace(0.0, 1.0, num=11)
    names = ['house_finch', 'rubber_eraser', 'goldfinch', 'killer_whale']
    for i in tqdm(range(len(images))):
        image = images[i]
        label = labels[i]
        name  = names[i]
        os.makedirs('data/{}/ablation/'.format(name) , exist_ok=True)
        saliency = utils.get_path_attributions(model, sess, grad_input_op, delta_pl, 
                          image, label, baseline_image, num_samples=500,
                          batch_size=32, random_alpha=True, random_sample=True,
                          verbose=False, take_difference=True)
        sum_abs_saliency = np.abs(np.sum(saliency, axis=-1))
        norm_clipped_saliency = utils.norm_clip(sum_abs_saliency)
        utils.save_image(norm_clipped_saliency, 'data/{}/ablation/saliency.png'.format(name),
                         minval=0.0, maxval=norm_clipped_saliency.max())
        for k in k_vals:
            ablated_image = utils.ablate_top_k(image, sum_abs_saliency, k, method=FLAGS.ablation_type)
            utils.save_image(ablated_image, 'data/{}/ablation/{}_{:.2f}.png'.format(name, 
                                                                                    FLAGS.ablation_type, 
                                                                                    k), 
                             minval=-1.0, maxval=1.0)
        

def save_samples(model, sess, images, labels, delta_pl, grad_op, grad_input_op):
    random_alpha  = True
    random_sample = True
    num_interp_points = 500
    if FLAGS.saliency_type == 'eg':
        #I don't include reference_images.npy in this github repo because of size constraints.
        #You can generate it using notebookts/save_background_references.ipynb
        baseline_image = np.load('data/ignored/reference_images.npy')
    elif FLAGS.saliency_type == 'uniform':
        baseline_image = np.stack([utils.get_uniform_image(images[0]) for _ in range(num_interp_points)], axis=0)
    elif FLAGS.saliency_type == 'ig':
        baseline_image = np.zeros(images[0].shape) - 1.0
        random_alpha  = False
        random_sample = False
    
    num_samples = FLAGS.num_samples
    num_read    = 0
    sample_images   = []
    sample_logits   = []
    sample_labels   = []
    sample_saliency = []
    print('Reading images and getting saliency maps...')
    while num_read < num_samples:
        current_image, current_label = sess.run([model.image_op, model.label_op])
        pred_logits   = sess.run(model.softmax_logits, feed_dict={model.images_pl: current_image})
        pred_label    = np.argmax(pred_logits, axis=-1)
        if pred_label == current_label:
            current_image = current_image[0]
            current_label = current_label[0]
            sample_images.append(current_image)
            sample_labels.append(current_label)
            sample_logits.append(pred_logits[0, current_label])
            
            if FLAGS.saliency_type == 'blur':
                baseline_image = utils.get_blurred_image(current_image, sigma=20.0)
                random_alpha  = False
                random_sample = False
            elif FLAGS.saliency_type == 'gaussian':
                baseline_image = np.stack([utils.get_gaussian_image(current_image, sigma=1.0) for _ in range(num_interp_points)], axis=0)
            elif FLAGS.saliency_type == 'max_dist':
                baseline_image = utils.get_max_distance_image(current_image)
                random_alpha  = False
                random_sample = False
            
            if FLAGS.saliency_type == 'null_gaussian':
                saliency = np.random.randn(*current_image.shape) 
            else:
                saliency = utils.get_path_attributions(model, sess, grad_input_op, delta_pl, 
                              current_image, current_label, baseline_image, num_samples=num_interp_points,
                              batch_size=32, random_alpha=random_alpha, random_sample=random_sample,
                              verbose=False, take_difference=True)
                
            saliency = np.sum(saliency, axis=-1)
            sample_saliency.append(saliency)
            
            num_read += 1
            print('{}/{}'.format(num_read, num_samples), end='\r')
    sample_images   = np.stack(sample_images, axis=0)
    sample_saliency = np.stack(sample_saliency, axis=0)
    sample_logits   = np.stack(sample_logits, axis=0)
    sample_labels   = np.stack(sample_labels, axis=0)
    
    np.save('data/ignored/sample_images_{}.npy'.format(FLAGS.saliency_type),   sample_images)
    np.save('data/ignored/sample_saliency_{}.npy'.format(FLAGS.saliency_type), sample_saliency)
    np.save('data/ignored/sample_logits_{}.npy'.format(FLAGS.saliency_type),   sample_logits)
    np.save('data/ignored/sample_labels_{}.npy'.format(FLAGS.saliency_type), sample_labels)
    
    return sample_images, sample_saliency, sample_logits, sample_labels

def run_ablation(model, sess, images, labels, delta_pl, grad_op, grad_input_op):
    print('Running tests with `{}` ablation and `{}` saliency maps'.format(FLAGS.ablation_type, FLAGS.saliency_type))
    try:
        sample_images   = np.load('data/ignored/sample_images_{}.npy'.format(FLAGS.saliency_type))
        sample_saliency = np.load('data/ignored/sample_saliency_{}.npy'.format(FLAGS.saliency_type))
        sample_logits   = np.load('data/ignored/sample_logits_{}.npy'.format(FLAGS.saliency_type))
        sample_labels   = np.load('data/ignored/sample_labels_{}.npy'.format(FLAGS.saliency_type))
        if FLAGS.num_samples != sample_images.shape[0]:
            raise ValueError('Specified {} samples but saved data has {} samples.'.format(FLAGS.num_samples, sample_images.shape[0]))
    except IOError:
        sample_images, sample_saliency, sample_logits, sample_labels = save_samples(model, sess, 
                                                                                    images, labels, 
                                                                                    delta_pl, grad_op, 
                                                                                    grad_input_op)
        
    batch_size = 32
    k_vals     = np.linspace(0.1, 1.0, num=10)
    mean_logits_fractions = []
    sd_logits_fractions   = []
    
    for k in tqdm(k_vals):
        total_logits_fractions = []
        for j in range(0, FLAGS.num_samples, batch_size):
            current_image_batch    = sample_images[j:min(j + batch_size, FLAGS.num_samples)]
            current_label_batch    = sample_labels[j:min(j + batch_size, FLAGS.num_samples)]
            current_logit_batch    = sample_logits[j:min(j + batch_size, FLAGS.num_samples)]
            current_saliency_batch = sample_saliency[j:min(j + batch_size, FLAGS.num_samples)]
            
            ablated_image_batch = np.stack([utils.ablate_top_k(current_image_batch[i], current_saliency_batch[i], k, method=FLAGS.ablation_type)
                                            for i in range(len(current_image_batch))], axis=0)
            
            new_pred_logits     = sess.run(model.softmax_logits, feed_dict={model.images_pl: ablated_image_batch})
            new_pred_logits     = new_pred_logits[np.arange(len(new_pred_logits)), current_label_batch]
            logits_fraction     = new_pred_logits / current_logit_batch
            total_logits_fractions.append(logits_fraction)
        total_logits_fractions = np.concatenate(total_logits_fractions, axis=0)
        mean_fraction = np.mean(total_logits_fractions)
        sd_fraction   = np.std(total_logits_fractions)
        
        mean_logits_fractions.append(mean_fraction)
        sd_logits_fractions.append(sd_fraction)
    
    logits_df = pd.DataFrame({
        'k': [0.0] + list(k_vals),
        'mean_logit_fraction': [1.0] + list(mean_logits_fractions),
        'sd_logit_fraction':   [0.0] + list(sd_logits_fractions)
    })
    logits_df.to_csv('data/ablation_data/{}_{}.csv'.format(FLAGS.ablation_type, FLAGS.saliency_type), index=False)

def main(argv=None):
    model, sess = get_model()
    
    images = np.load('data/images.npy')
    labels = np.load('data/labels.npy')
    
    delta_pl = tf.placeholder(tf.float32, [None, 299, 299, 3])
    
    grad_op = utils._grad_across_multi_output(output_tensor=model.logits, input_tensor=model.images_pl, sparse_labels_op=model.labels_pl)
    grad_input_op = grad_op * delta_pl
    
    if FLAGS.run_everything:
        ablation_types = ['mean', 'blur', 'mean_center', 'blur_center']
        saliency_types = ['eg', 'blur', 'gaussian', 'uniform', 'ig', 'max_dist', 'null_gaussian']
        for ablation_type in ablation_types:
            FLAGS.ablation_type = ablation_type 
            save_ablation_examples(model, sess, images, labels, delta_pl, grad_op, grad_input_op)
            for saliency_type in saliency_types:
                FLAGS.saliency_type = saliency_type
                run_ablation(model, sess, images, labels, delta_pl, grad_op, grad_input_op)
        
    elif FLAGS.save_examples:
        save_ablation_examples(model, sess, images, labels, delta_pl, grad_op, grad_input_op)
    else:
        run_ablation(model, sess, images, labels, delta_pl, grad_op, grad_input_op)
        
if __name__ == '__main__':
    app.run(main)
