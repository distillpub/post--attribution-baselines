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
import abseil
import utils

from absl import app
from absl import flags

FLAGS = flags.FLAGS
flags.DEFINE_string('experiment', 'baselines', 'One of `blur`, ``')

image_names = ['house_finch', 'rubber_eraser', 'goldfinch', 'killer_whale']

def run_gaussian(model, sess, images, labels, image_op, images_pl, labels_pl,
                 label_op, logits, pred_labels, delta_pl, grad_op, grad_input_op):
    
    
    
        
def main(argv=None):
    model, sess = get_model()
    
    images = np.load('data/images.npy')
    labels = np.load('data/labels.npy')
    
    image_op    = model.image_op
    images_pl   = model.images_pl
    labels_pl   = model.labels_pl
    label_op    = model.label_op
    logits      = model.logits
    pred_labels = model.pred_labels
    delta_pl = tf.placeholder(tf.float32, [None, 299, 299, 3])
    
    grad_op = utils._grad_across_multi_output(output_tensor=logits, input_tensor=images_pl, sparse_labels_op=labels_pl)
    grad_input_op = grad_op * delta_pl
    
    if FLAGS.experiment == 'blur':
        for name in image_names:
            os.makedirs('data/{}/baselines/blur/'.format(name) , exist_ok=True)
        
        get_acc_ig_weights(model, sess, images, labels, image_op, images_pl, labels_pl,
                 label_op, logits, pred_labels, delta_pl, grad_op, grad_input_op)
    
        
if __name__ == '__main__':
    app.run(main)
