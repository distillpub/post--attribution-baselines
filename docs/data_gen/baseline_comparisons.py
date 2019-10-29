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
import os
import json
import shap
import ops
import utils

from absl import app
from absl import flags

FLAGS = flags.FLAGS
flags.DEFINE_string('experiment', 'baselines', 'One of `blur`, `max_dist`, `uniform`, `gaussian`')

image_names = ['house_finch', 'rubber_eraser', 'goldfinch', 'killer_whale']

def run_blur(model, sess, images, labels, delta_pl, grad_op, grad_input_op):
    sigmas = np.linspace(5, 50, num=10)
    
    for i in range(len(image_names)):
        image = images[i]
        label = labels[i]
        name  = image_names[i]
        base_dir = 'data/{}/baselines/blur/'.format(name)
        
        print('Getting saliency with a blurred baseline on image {}'.format(name))
        
        for sigma in tqdm(sigmas):
            blurred_baseline = utils.get_blurred_image(image, sigma=sigma)
            ig_saliency = utils.get_path_attributions(model, sess, grad_input_op, delta_pl, 
                          image, label, blurred_baseline, num_samples=501,
                          batch_size=32, random_alpha=False, random_sample=False,
                          verbose=False, take_difference=True)
            sum_abs_ig = np.abs(np.sum(ig_saliency, axis=-1))
            sum_abs_ig = utils.norm_clip(sum_abs_ig)
            
            utils.save_image(blurred_baseline, base_dir + 'baseline_sigma{}.png'.format(sigma), minval=-1.0, maxval=1.0)
            utils.save_image(sum_abs_ig, base_dir + 'saliency_sigma{}.png'.format(sigma), minval=0.0, maxval=sum_abs_ig.max())

def run_max_dist(model, sess, images, labels, delta_pl, grad_op, grad_input_op):
    for i in range(len(image_names)):
        image = images[i]
        label = labels[i]
        name  = image_names[i]
        base_dir = 'data/{}/baselines/max_dist/'.format(name)
        
        print('Getting saliency with a max distance baseline on image {}'.format(name))
        
        max_dist_baseline = utils.get_max_distance_image(image)
        ig_saliency = utils.get_path_attributions(model, sess, grad_input_op, delta_pl, 
                      image, label, max_dist_baseline, num_samples=501,
                      batch_size=32, random_alpha=False, random_sample=False,
                      verbose=True, take_difference=True)
        sum_abs_ig = np.abs(np.sum(ig_saliency, axis=-1))
        sum_abs_ig = utils.norm_clip(sum_abs_ig)
        
        utils.save_image(max_dist_baseline, base_dir + 'baseline.png', minval=-1.0, maxval=1.0)
        utils.save_image(sum_abs_ig, base_dir + 'saliency.png', minval=0.0, maxval=sum_abs_ig.max())

def run_uniform(model, sess, images, labels, delta_pl, grad_op, grad_input_op):
    for i in range(len(image_names)):
        image = images[i]
        label = labels[i]
        name  = image_names[i]
        base_dir = 'data/{}/baselines/uniform/'.format(name)
        
        print('Getting saliency with a uniform baseline on image {}'.format(name))
        
        uniform_baseline = utils.get_uniform_image(image)
        ig_saliency = utils.get_path_attributions(model, sess, grad_input_op, delta_pl, 
                      image, label, uniform_baseline, num_samples=501,
                      batch_size=32, random_alpha=False, random_sample=False,
                      verbose=True, take_difference=True)
        sum_abs_ig = np.abs(np.sum(ig_saliency, axis=-1))
        sum_abs_ig = utils.norm_clip(sum_abs_ig)
        
        utils.save_image(uniform_baseline, base_dir + 'baseline.png', minval=-1.0, maxval=1.0)
        utils.save_image(sum_abs_ig, base_dir + 'saliency.png', minval=0.0, maxval=sum_abs_ig.max())
        
        uniform_baseline_eg = np.stack([utils.get_uniform_image(image) for _ in range(501)], axis=0)
        eg_saliency = utils.get_path_attributions(model, sess, grad_input_op, delta_pl, 
                      image, label, uniform_baseline_eg, num_samples=501,
                      batch_size=32, random_alpha=True, random_sample=True,
                      verbose=True, take_difference=True)
        sum_abs_eg = np.abs(np.sum(eg_saliency, axis=-1))
        sum_abs_eg = utils.norm_clip(sum_abs_eg)
        
        for i in range(3):
            utils.save_image(uniform_baseline_eg[i], base_dir + 'baseline{}.png'.format(i), minval=-1.0, maxval=1.0)
        utils.save_image(sum_abs_eg, base_dir + 'saliency_eg.png', minval=0.0, maxval=sum_abs_eg.max())

def run_gaussian(model, sess, images, labels, delta_pl, grad_op, grad_input_op):
    sigmas = np.linspace(0.5, 3.0, 6)
    
    for i in range(len(image_names)):
        image = images[i]
        label = labels[i]
        name  = image_names[i]
        base_dir = 'data/{}/baselines/gaussian/'.format(name)
        
        print('Getting saliency with a gaussian baseline on image {}'.format(name))
        
        for sigma in tqdm(sigmas):
            gaussian_baseline = utils.get_gaussian_image(image, sigma)
            ig_saliency = utils.get_path_attributions(model, sess, grad_input_op, delta_pl, 
                          image, label, gaussian_baseline, num_samples=501,
                          batch_size=32, random_alpha=False, random_sample=False,
                          verbose=False, take_difference=True)
            sum_abs_ig = np.abs(np.sum(ig_saliency, axis=-1))
            sum_abs_ig = utils.norm_clip(sum_abs_ig)
            
            utils.save_image(gaussian_baseline, base_dir + 'baseline_sigma{}.png'.format(sigma), minval=-1.0, maxval=1.0)
            utils.save_image(sum_abs_ig, base_dir + 'saliency_sigma{}.png'.format(sigma), minval=0.0, maxval=sum_abs_ig.max())
            
            gaussian_baseline_eg = np.stack([utils.get_uniform_image(image) for _ in range(501)], axis=0)
            eg_saliency = utils.get_path_attributions(model, sess, grad_input_op, delta_pl, 
                          image, label, gaussian_baseline_eg, num_samples=501,
                          batch_size=32, random_alpha=True, random_sample=True,
                          verbose=False, take_difference=True)
            sum_abs_eg = np.abs(np.sum(eg_saliency, axis=-1))
            sum_abs_eg = utils.norm_clip(sum_abs_eg)

            for i in range(3):
                utils.save_image(gaussian_baseline_eg[i], base_dir + 'baseline{}_sigma{}.png'.format(i, sigma), minval=-1.0, maxval=1.0)
            utils.save_image(sum_abs_eg, base_dir + 'saliency_eg_sigma{}.png'.format(sigma), minval=0.0, maxval=sum_abs_eg.max())
            
            sg_saliency = utils.get_path_attributions(model, sess, grad_input_op, delta_pl, 
                          image, label, gaussian_baseline_eg, num_samples=501,
                          batch_size=32, random_alpha=True, random_sample=True,
                          verbose=False, take_difference=False)
            sum_abs_sg = np.abs(np.sum(sg_saliency, axis=-1))
            sum_abs_sg = utils.norm_clip(sum_abs_sg)
            utils.save_image(sum_abs_sg, base_dir + 'saliency_sg_sigma{}.png'.format(sigma), minval=0.0, maxval=sum_abs_sg.max())
            
        
def main(argv=None):
    model, sess = get_model()
    
    images = np.load('data/images.npy')
    labels = np.load('data/labels.npy')
    
    delta_pl = tf.placeholder(tf.float32, [None, 299, 299, 3])
    
    grad_op = utils._grad_across_multi_output(output_tensor=model.logits, input_tensor=model.images_pl, sparse_labels_op=model.labels_pl)
    grad_input_op = grad_op * delta_pl
    
    if FLAGS.experiment == 'blur':
        for name in image_names:
            os.makedirs('data/{}/baselines/blur/'.format(name) , exist_ok=True)
        run_blur(model, sess, images, labels, delta_pl, grad_op, grad_input_op)
    elif FLAGS.experiment == 'max_dist':
        for name in image_names:
            os.makedirs('data/{}/baselines/max_dist/'.format(name) , exist_ok=True)
        run_max_dist(model, sess, images, labels, delta_pl, grad_op, grad_input_op)
    elif FLAGS.experiment == 'uniform':
        for name in image_names:
            os.makedirs('data/{}/baselines/uniform/'.format(name) , exist_ok=True)
        run_uniform(model, sess, images, labels, delta_pl, grad_op, grad_input_op)
    elif FLAGS.experiment == 'gaussian':
        for name in image_names:
            os.makedirs('data/{}/baselines/gaussian/'.format(name) , exist_ok=True)
        run_gaussian(model, sess, images, labels, delta_pl, grad_op, grad_input_op)
    else:
        raise ValueError('Unrecognized value `{}` for flag experiment'.format(FLAGS.experiment))
    
        
if __name__ == '__main__':
    app.run(main)
