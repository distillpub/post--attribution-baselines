import tensorflow as tf
import numpy as np
from scipy.ndimage import gaussian_filter, center_of_mass
from tqdm import tqdm
from PIL import Image

def save_image(image, filename, minval=-1.0, maxval=1.0):
    normalized_image = normalize(image, _domain=(minval, maxval), _range=(0.0, 255.0))
    normalized_image = normalized_image.astype(np.uint8)
    Image.fromarray(normalized_image).save(filename)

def get_max_distance_image(image, minval=-1.0, maxval=1.0):
    meanval = (minval + maxval) * 0.5
    max_dist_im = np.full(image.shape, minval, dtype=image.dtype)
    max_dist_im[image < meanval] = maxval
    return max_dist_im

def get_blurred_image(image, sigma=10):
    if len(image.shape) == 4:
        blurred_images = [gaussian_filter(im, (sigma, sigma, 0)) for im in image]
        return np.stack(blurred_images, axis=0)
    elif len(image.shape) == 3:
        return gaussian_filter(image, (sigma, sigma, 0))
    else:
        return gaussian_filter(image, sigma)
    
def get_uniform_image(image, minval=-1.0, maxval=1.0):
    return np.random.uniform(low=minval, high=maxval, size=image.shape)

def get_gaussian_image(image, sigma, mean_image=None, minval=-1.0, maxval=1.0):
    if mean_image is None:
        mean_image = image
    gaussian_image = np.random.randn(*image.shape) * sigma + mean_image
    return np.clip(gaussian_image, a_min=minval, a_max=maxval)

def _get_top_indices(saliency):
    '''
    Returns the indices of saliency ranked in descending order.
    
    Args:
        saliency: A 2D array
    
    Returns:
        An array of shape [np.prod(saliency.shape), 2] representing
        the indices of saliency in descending order of magnitude.
    '''
    return np.flip(np.squeeze(np.dstack(np.unravel_index(np.argsort(saliency.ravel()), 
                                                         saliency.shape))), axis=0)

def ablate_top_k(image, saliency, k, method='mean'):
    '''
    Ablates the top k% pixels in the image as ranked by saliency. 
    
    Args:
        image:    A (width, height, channels) array
        saliency: A (width, height) array of absolute values
        k:        A floating point number between 0.0 and 1.0. The fraction
                  of top pixels to ablate. If the method is `mass_center` or
                  `blur_center`, k instead represents the fraction of the total image to cover.
        method:   One of `mean`, `blur`, `mean_center`, `blur_center`.
        
    Returns:
        An ablated image. Used for interpretability experiments.
    '''
    if k == 0.0:
        return image
    
    ablated_image = image.copy()
    if method == 'mean' or method == 'mean_center':
        baseline_image = np.ones(image.shape) * np.mean(image, axis=(0, 1), keepdims=True)
    elif method == 'blur' or method == 'blur_center':
        baseline_image = get_blurred_image(image, sigma=20.0)
    
    if method == 'mean' or method == 'blur':
        indices     = _get_top_indices(saliency)
        max_to_flip = int(k * indices.shape[0])
        ablated_image[indices[:max_to_flip, 0], 
                      indices[:max_to_flip, 1]] = baseline_image[indices[:max_to_flip, 0],
                                                                 indices[:max_to_flip, 1]]
    elif method == 'mean_center' or method == 'blur_center':
        center_indices = np.array(center_of_mass(saliency))
        lower_bounds   = (center_indices * (1.0 - k)).astype(int)
        upper_bounds   = ((np.array(saliency.shape) - center_indices) * k + center_indices).astype(int)
        
        ablated_image[lower_bounds[0]:upper_bounds[0], 
                      lower_bounds[1]:upper_bounds[1]] = baseline_image[lower_bounds[0]:upper_bounds[0],
                                                                        lower_bounds[1]:upper_bounds[1]]
    return ablated_image
    
def normalize(im_batch, _range=None, _domain=None):
    if len(im_batch.shape) == 2:
        axis = (0, 1)
    elif len(im_batch.shape) == 3:
        axis = (0, 1, 2)
    elif len(im_batch.shape) == 4:
        axis = (1, 2, 3)
    else:
        raise ValueError('im_batch must be of rank 2, 3 or 4')
    
    if _domain is not None:
        min_vals = _domain[0]
        max_vals = _domain[1]
    else:
        min_vals = np.amin(im_batch, axis=axis, keepdims=True)
        max_vals = np.amax(im_batch, axis=axis, keepdims=True)
    
    norm_batch = (im_batch - min_vals) / (max_vals - min_vals)
    
    if _range is not None:
        amin = _range[0]
        amax = _range[1]
        norm_batch = norm_batch * (amax - amin) + amin
    return norm_batch

def norm_clip(x):
    normalized = normalize(x.squeeze())
    clipped = np.clip(normalized, a_min=np.min(normalized), a_max=np.percentile(normalized, 99.9))
    return clipped

def _grad_across_multi_output(output_tensor, input_tensor, sparse_labels_op=None):
    '''
    Calculates the gradients for each output with respect to each input.
    Args:
        input_tensor: An input tensor of shape [None, ...] where ...
                      indicates the input dimensions. This function will throw an
                      error if input_tensor is of type list.
        output_tensor: A tensor indicating the output of the model. Should be shaped as
                       [None, num_classes] where None indicates the batch dimension
                       and num_classes is the number of output classes of the model.
    Returns:
        A tensor of shape [None, num_classes, ...], where the ... indicates the input dimensions.
    '''
    if sparse_labels_op is not None:
        sample_indices = tf.range(tf.shape(output_tensor)[0])

        indices_tensor = tf.stack([sample_indices, tf.cast(sparse_labels_op, tf.int32)], axis=1)

        class_selected_output_tensor = tf.gather_nd(output_tensor, indices_tensor)

        class_selected_output_tensor.set_shape([None])
        grad_tensor = tf.gradients(class_selected_output_tensor, input_tensor)[0]
        return grad_tensor
    else:
        output_class_tensors = tf.unstack(output_tensor, axis=1)
        grad_tensors = []
        for output_class_tensor in output_class_tensors:
            grad_tensor = tf.gradients(output_class_tensor, input_tensor)[0]
            grad_tensors.append(grad_tensor)
        multi_grad_tensor = tf.stack(grad_tensors, axis=1)
        return multi_grad_tensor
    
def get_path_attributions(model, sess, saliency_op, delta_pl, 
                          image, label, background_reference, num_samples=501,
                          batch_size=32, random_alpha=True, random_sample=True,
                          verbose=False, take_difference=True):
    '''
    A helper function to compute path attributions given a particular reference.
    
    Args:
        model: An object created from get_network.py
        sess:  A tensorflow session.
        saliency_op: An operation that when run provides the desired saliency at a single point.
                     Most likely, this should be gradients * delta_pl
        delta_pl:    A placeholder used to multiply the gradients with. Generally the difference
                     from reference, but can also represent the input in the case of SmoothGrad.
        image:       The input image.
        label:       The label associated with the input image. An integer.
        background_reference: Either a (batch_size, ...)-shaped array or a (...)-shaped array
                              where ... indicates the shape of the input. See "random_sample".
        num_samples: The number of interpolation points. Defaults to 501 because I wanted to
                     have no issues with convergence, but normally it seems ~100 suffices.
        batch_size:  The number of images to input to the network at once. Defaults to 32.
        random_alpha:  Whether or not to randomly sample the interpolation constant
                       or generate it linearly spaced. Defauls to True.
        random_sample: Whether or not to randomly sample the background references. If true,
                       this assumes that background_reference is an array where the first
                       dimension represents the number of background samples and will randomly
                       sample from those samples without replacement. If false, this assumes
                       that background_reference is the same shape as the image and will
                       use the same baseline for all interpolation points. Defaults to true.
        verbose:     If true, prints a progress bar while running. Defaults to true.
        take_difference: If true, multiplies the saliency_op by the difference from reference.
                         If false, multiplies the saliency_op by the input (as in SmoothGrad).
                         Defaults to true.
    
    Returns:
        An array the same shape as the input. The desired saliency.
    '''
    saliency_array = []
    
    if random_alpha:
        alphas = np.random.uniform(low=0.0, high=1.0, size=(num_samples, ))
    else:
        alphas = np.linspace(start=0.0, stop=1.0, num=num_samples)
    
    if random_sample:
        sample_indices = np.random.choice(background_reference.shape[0], 
                                          size=num_samples,
                                          replace=False)
    else:
        sample_indices = [0] * num_samples
        background_reference = np.expand_dims(background_reference, axis=0)
    
    target_image = np.expand_dims(image, axis=0)
    target_label = np.expand_dims(label, axis=0)
    
    if verbose:
        iterable = tqdm(range(0, num_samples, batch_size))
    else:
        iterable = range(0, num_samples, batch_size)
    
    for j in iterable:
        current_alphas     = alphas[j:min(j + batch_size, num_samples)]
        current_alphas     = current_alphas[:, np.newaxis, np.newaxis, np.newaxis]
        current_references = background_reference[sample_indices[j:min(j + batch_size, num_samples)]]
        
        current_label = np.tile(target_label, (min(batch_size, num_samples - j),))
        
        interp_input = current_alphas * target_image + \
                      (1.0 - current_alphas) * current_references
        if take_difference:
            delta_input = target_image - current_references
        else:
            delta_input = interp_input.copy()
        
        current_saliency = sess.run(saliency_op, feed_dict={
            model.images_pl: interp_input,
            model.labels_pl: current_label,
            delta_pl:        delta_input,
        })
        saliency_array.append(current_saliency)
    
    saliency_array = np.concatenate(saliency_array, axis=0)
    return np.mean(saliency_array, axis=0)