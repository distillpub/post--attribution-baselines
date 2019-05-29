import math
import tensorflow as tf
import numpy as np

from datasets import dataset_factory
from nets import nets_factory
from preprocessing import preprocessing_factory

import eval_image_classifier

slim = tf.contrib.slim
FLAGS = tf.app.flags.FLAGS

def normalize(im_batch):
    if len(im_batch.shape) == 3:
        axis = (0, 1, 2)
    elif len(im_batch.shape) == 4:
        axis = (1, 2, 3)
    else:
        raise ValueError('im_batch must be of rank 3 or 4')
        
    max_vals = np.amax(im_batch, axis=axis, keepdims=True)
    min_vals = np.amin(im_batch, axis=axis, keepdims=True)
    return (im_batch - min_vals) / (max_vals - min_vals)

def main():
    FLAGS.batch_size = 4
    FLAGS.dataset_name = 'imagenet'
    FLAGS.dataset_split_name = 'validation'
    FLAGS.dataset_dir = '/data/image_datasets/imagenet/'
    FLAGS.eval_image_size = 299
    FLAGS.model_name = 'inception_v4'
    FLAGS.checkpoint_path = 'inception_v4.ckpt'

    tf.logging.set_verbosity(tf.logging.ERROR)
    tf_global_step = slim.get_or_create_global_step()

    ######################
    # Select the dataset #
    ######################
    dataset = dataset_factory.get_dataset(
        FLAGS.dataset_name, FLAGS.dataset_split_name, FLAGS.dataset_dir)

    ####################
    # Select the model #
    ####################
    network_fn = nets_factory.get_network_fn(
        FLAGS.model_name,
        num_classes=(dataset.num_classes - FLAGS.labels_offset),
        is_training=False)

    ##############################################################
    # Create a dataset provider that loads data from the dataset #
    ##############################################################
    provider = slim.dataset_data_provider.DatasetDataProvider(
        dataset,
        shuffle=False,
        common_queue_capacity=2 * FLAGS.batch_size,
        common_queue_min=FLAGS.batch_size)
    [image, label] = provider.get(['image', 'label'])
    label -= FLAGS.labels_offset

    #####################################
    # Select the preprocessing function #
    #####################################
    preprocessing_name = FLAGS.preprocessing_name or FLAGS.model_name
    image_preprocessing_fn = preprocessing_factory.get_preprocessing(
        preprocessing_name,
        is_training=False)

    eval_image_size = FLAGS.eval_image_size or network_fn.default_image_size

    image = image_preprocessing_fn(image, eval_image_size, eval_image_size)

    images, labels = tf.train.batch(
        [image, label],
        batch_size=FLAGS.batch_size,
        num_threads=FLAGS.num_preprocessing_threads,
        capacity=5 * FLAGS.batch_size)

    ####################
    # Define the model #
    ####################
    images_pl = tf.placeholder(tf.float32, (None, 299, 299, 3))
    logits, _ = network_fn(images_pl)
    pred_labels   = tf.argmax(logits, axis=1)

    variables_to_restore = slim.get_variables_to_restore()
    
    config = tf.ConfigProto()
    config.gpu_options.allow_growth = True
    sess = tf.Session(config=config)

    coord=tf.train.Coordinator()
    threads=tf.train.start_queue_runners(coord=coord, sess=sess)
    
    saver = tf.train.Saver(variables_to_restore)
    saver.restore(sess, FLAGS.checkpoint_path)
    
    class Model(object):
        pass
    
    model = Model()
    model.images_pl = images_pl
    model.logits = logits
    model.pred_labels = pred_labels
    model.image_op  = images
    model.label_op  = labels
    return model, sess