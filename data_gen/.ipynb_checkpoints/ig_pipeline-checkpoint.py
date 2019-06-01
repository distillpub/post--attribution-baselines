import tensorflow as tf
import numpy as np
import altair as alt
import pandas as pd
import matplotlib.pyplot as plt
from get_network import get_model, normalize
from regularized_explanations import ops, ig
from tqdm import tqdm
from scipy import special
import scipy.misc
import os
import json
import shap

from skimage.segmentation import felzenszwalb, slic, quickshift, watershed, mark_boundaries

tf.app.flags.DEFINE_string('run', 'acc', 'One of `acc`, `slic`, `csv`, `logits`, `eg_pair`, `eg_samples`')
FLAGS = tf.app.flags.FLAGS

def norm_clip(x):
    normalized = normalize(x.squeeze())
    clipped = np.clip(normalized, a_min=np.min(normalized), a_max=np.percentile(normalized, 99.9))
    return clipped

def get_eg_samples(model, sess):
    print('Running expected gradients over samples...')
    images = np.load('data/images.npy')
    labels = np.load('data/labels.npy')
    segmentation = np.load('data/segmentation.npy')
    means_df = pd.read_csv('data/cluster_means.csv')
    
    image_op    = model.image_op
    images_pl   = model.images_pl
    labels_pl   = model.labels_pl
    label_op    = model.label_op
    logits      = model.logits
    pred_labels = model.pred_labels
    
    delta_pl = tf.placeholder(tf.float32, [None, 299, 299, 3])

    explainer = ops.TFOpsExplainer()
    grad_op = explainer._grad_across_multi_output(output_tensor=logits, input_tensor=images_pl, sparse_labels_op=labels_pl)
    grad_input_op = grad_op * delta_pl
    
    image_names = ['house_finch', 'rubber_eraser', 'goldfinch', 'killer_whale']
    num_samples = 51
    
    reference_images = []
    for sample in range(num_samples):
        im_batch = sess.run(image_op)
        reference_images.append(im_batch)
    reference_images = np.concatenate(reference_images, axis=0)

    image_names = ['house_finch', 'rubber_eraser', 'goldfinch', 'killer_whale']
    for i in range(len(image_names)):
        name = image_names[i]
        print('Running pipeline on image `{}`'.format(name))
        image_input = images[i]
        label_input = labels[i]

        image_input = np.expand_dims(image_input, axis=0)
        label_input = np.expand_dims(label_input, axis=0)
        
        raw_weights_acc = []
        raw_input_refs = []
        interp_inputs_acc = []
        
        base_dir = 'data/{}/eg_samples/'.format(name)
        os.makedirs(base_dir, exist_ok=True)
        
        print('Getting eg weights for each sample...')
        for sample in tqdm(range(num_samples)):
            reference = reference_images[sample, :, :, :]
            reference = np.expand_dims(reference, axis=0)
            alpha = np.random.uniform(low=0.0, high=1.0)
            
            interp_input = alpha * image_input + (1.0 - alpha) * reference
            interp_input = np.clip(interp_input, a_min=-1.0, a_max=1.0)
            ig_sample = sess.run(grad_input_op, feed_dict = {images_pl: interp_input, 
                                                             labels_pl: label_input,
                                                             delta_pl:  image_input - reference})
            raw_weights_acc.append(ig_sample)
            interp_inputs_acc.append(interp_input)
            raw_input_refs.append(reference)

        raw_weights_acc = np.array(raw_weights_acc).squeeze()
        interp_inputs_acc = np.array(interp_inputs_acc).squeeze()
        raw_input_refs = np.array(raw_input_refs).squeeze()

        ig_weights_cu = np.cumsum(raw_weights_acc, axis=0)
        ig_weights_cu = np.sum(ig_weights_cu, axis=-1)
        ig_weights_cu = np.abs(ig_weights_cu)
        divisor = np.arange(ig_weights_cu.shape[0]) + 1
        divisor = divisor[:, np.newaxis, np.newaxis]
        ig_weights_cu = ig_weights_cu / divisor

        print('Saving eg weight images as png files...')
        for i in tqdm(range(num_samples)):
            weights = raw_weights_acc[i]
            weights = np.abs(np.sum(weights, axis=-1))
            im_weights = norm_clip(weights)
            interp  = interp_inputs_acc[i]
            ref = raw_input_refs[i]
            scipy.misc.toimage(im_weights).save(base_dir + 'point_weights_{}.png'.format(i))
            scipy.misc.toimage(interp, cmin=-1.0, cmax=1.0).save(base_dir + 'interpolated_image_{}.png'.format(i))
            scipy.misc.toimage(ref, cmin=-1.0, cmax=1.0).save(base_dir + 'reference_{}.png'.format(i))
            
            weights = ig_weights_cu[i]
            im_weights = norm_clip(weights)
            scipy.misc.toimage(im_weights).save(base_dir + 'cumulative_weights_{}.png'.format(i))

        logit_out = sess.run(logits, feed_dict={images_pl: image_input})
        baseline_logit_out = sess.run(logits, feed_dict={images_pl: reference})

        output_val = logit_out[0, label_input[0]]
        baseline_output_val = baseline_logit_out[0, label_input[0]]
        target_sum = output_val - baseline_output_val

        raw_ig = np.mean(raw_weights_acc, axis=0)
        raw_weights_acc_sum = np.sum(raw_weights_acc, axis=(1,2,3))

        raw_weights_cu = np.cumsum(raw_weights_acc, axis=0)
        divisor = np.arange(raw_weights_cu.shape[0]) + 1
        divisor = divisor[:, np.newaxis, np.newaxis, np.newaxis]
        raw_weights_cu = raw_weights_cu / divisor
        raw_weights_sum = np.sum(raw_weights_cu, axis=(1,2,3))

        data = pd.DataFrame({
            'cumulative_sum': list(raw_weights_sum) + [target_sum] * num_samples,
            'sample': list(np.arange(num_samples)) * 2,
            'method': ['IG'] * num_samples + ['Target'] * num_samples
        })

        data.to_csv(base_dir + 'cumulative_sums.csv'.format(name), index=False)
        
    
def get_eg_pairwise(model, sess):
    print('Running pairwise expected gradients...')
    images = np.load('data/images.npy')
    labels = np.load('data/labels.npy')
    segmentation = np.load('data/segmentation.npy')
    means_df = pd.read_csv('data/cluster_means.csv')
    
    image_op    = model.image_op
    images_pl   = model.images_pl
    labels_pl   = model.labels_pl
    label_op    = model.label_op
    logits      = model.logits
    pred_labels = model.pred_labels
    
    delta_pl = tf.placeholder(tf.float32, [None, 299, 299, 3])

    explainer = ops.TFOpsExplainer()
    grad_op = explainer._grad_across_multi_output(output_tensor=logits, input_tensor=images_pl, sparse_labels_op=labels_pl)
    grad_input_op = grad_op * delta_pl
    
    alpha_range = np.linspace(0.0, 1.0, num=51)
    alpha_range = np.rint(alpha_range * 100) / 100.0
    
    image_names = ['house_finch', 'rubber_eraser', 'goldfinch', 'killer_whale']
    for i in range(len(image_names)):
        name = image_names[i]
        print('Running pipeline on image `{}`'.format(name))
        image_input = images[i]
        label_input = labels[i]
        
        image_input = np.expand_dims(image_input, axis=0)
        label_input = np.expand_dims(label_input, axis=0)
        
        for j in range(len(image_names)):
           
            if j == i:
                continue
                
            reference_name = image_names[j]
            base_dir = 'data/{}/eg_pairwise/{}/'.format(name, reference_name)
            os.makedirs(base_dir, exist_ok=True)
            
            print('Using reference `{}`, saving to {}'.format(reference_name, base_dir))
            reference = images[j]
            reference = np.expand_dims(reference, axis=0)
        
            raw_weights_acc = []
            interp_inputs_acc = []

            print('Getting ig weights for each alpha value...')
            for alpha in tqdm(alpha_range):
                interp_input = alpha * image_input + (1.0 - alpha) * reference
                interp_input = np.clip(interp_input, a_min=-1.0, a_max=1.0)
                ig_sample = sess.run(grad_input_op, feed_dict = {images_pl: interp_input, 
                                                                 labels_pl: label_input,
                                                                 delta_pl:  image_input - reference})
                raw_weights_acc.append(ig_sample)
                interp_inputs_acc.append(interp_input)

            raw_weights_acc = np.array(raw_weights_acc).squeeze()
            interp_inputs_acc = np.array(interp_inputs_acc).squeeze()

            ig_weights_cu = np.cumsum(raw_weights_acc, axis=0)
            ig_weights_cu = np.sum(ig_weights_cu, axis=-1)
            ig_weights_cu = np.abs(ig_weights_cu)
            divisor = np.arange(ig_weights_cu.shape[0]) + 1
            divisor = divisor[:, np.newaxis, np.newaxis]
            ig_weights_cu = ig_weights_cu / divisor

            print('Saving ig weight images as png files...')
            for i in tqdm(range(len(alpha_range))):
                alpha = alpha_range[i]
                alpha = np.rint(alpha * 100) / 100.0
                weights = raw_weights_acc[i]
                weights = np.abs(np.sum(weights, axis=-1))
                im_weights = norm_clip(weights)
                interp  = interp_inputs_acc[i]
                scipy.misc.toimage(im_weights).save(base_dir + 'point_weights_{}.png'.format(alpha))
                scipy.misc.toimage(interp, cmin=-1.0, cmax=1.0).save(base_dir + 'interpolated_image_{}.png'.format(alpha))

                weights = ig_weights_cu[i]
                im_weights = norm_clip(weights)
                scipy.misc.toimage(im_weights).save(base_dir + 'cumulative_weights_{}.png'.format(alpha))

            logit_out = sess.run(logits, feed_dict={images_pl: image_input})
            baseline_logit_out = sess.run(logits, feed_dict={images_pl: reference})

            output_val = logit_out[0, label_input[0]]
            baseline_output_val = baseline_logit_out[0, label_input[0]]
            target_sum = output_val - baseline_output_val

            raw_ig = np.mean(raw_weights_acc, axis=0)
            raw_weights_acc_sum = np.sum(raw_weights_acc, axis=(1,2,3))

            raw_weights_cu = np.cumsum(raw_weights_acc, axis=0)
            divisor = np.arange(raw_weights_cu.shape[0]) + 1
            divisor = divisor[:, np.newaxis, np.newaxis, np.newaxis]
            raw_weights_cu = raw_weights_cu / divisor
            raw_weights_sum = np.sum(raw_weights_cu, axis=(1,2,3))

            data = pd.DataFrame({
                'cumulative_sum': list(raw_weights_sum) + [target_sum] * len(alpha_range),
                'alpha': list(alpha_range) * 2,
                'method': ['IG'] * len(alpha_range) + ['Target'] * len(alpha_range)
            })

            data.to_csv(base_dir + 'cumulative_sums.csv', index=False)

def get_logits_and_names():
    print('Running logits...')
    logits = np.load('data/logits.npy')
    normalized_logits = special.softmax(logits, axis=1)
    
    url = "https://s3.amazonaws.com/deep-learning-models/image-models/imagenet_class_index.json"
    fname = shap.datasets.cache(url)
    with open(fname) as f:
        class_names = json.load(f)
    
    sorted_predictions = np.argsort(normalized_logits, axis=1)
    
    all_names  = []
    all_logits = []
    ranks = np.arange(5) + 1
    for rank in ranks:
        pred_batch  = sorted_predictions[:, -rank]
        pred_logits = normalized_logits[np.arange(normalized_logits.shape[0]), pred_batch]
        pred_names = np.vectorize(lambda x: class_names[str(x)][1])(pred_batch - 1)
        
        all_names.append(pred_names)
        all_logits.append(pred_logits)
        
    all_names  = np.array(all_names)
    all_logits = np.array(all_logits)
    
    image_names = ['house_finch', 'rubber_eraser', 'goldfinch', 'killer_whale']
    for i in range(len(image_names)):
        data = pd.DataFrame({
            'rank': ranks,
            'pred_name': all_names[:, i],
            'pred_logit': all_logits[:, i]
        })
        data.to_csv('data/{}/logit_data.csv'.format(image_names[i]))

def get_slic_as_csv():
    print('Saving slic masks as json dictionaries...')
    slic_masks = np.load('data/segmentation.npy')
    
    image_names = ['house_finch', 'rubber_eraser', 'goldfinch', 'killer_whale']
    for k in range(len(image_names)):
        name = image_names[k]
        print('Running pipeline on image `{}`'.format(name))
        
        slic_mask = slic_masks[k]
        d = {}
        for i in tqdm(range(slic_mask.shape[0])):
            d[i] = {}
            for j in range(slic_mask.shape[1]):
                d[i][j] = int(slic_mask[i, j])
        with open('data/{}/slic/segmentation_dict.json'.format(name), 'w') as fp:
            json.dump(d, fp, indent=4)
    
def get_ig_weights_slic(model, sess):
    print('Running slic...')
    images = np.load('data/images.npy')
    labels = np.load('data/labels.npy')
    segmentation = np.load('data/segmentation.npy')
    means_df_base = pd.read_csv('data/cluster_means.csv')
    
    image_op    = model.image_op
    images_pl   = model.images_pl
    labels_pl   = model.labels_pl
    label_op    = model.label_op
    logits      = model.logits
    pred_labels = model.pred_labels
    train_eg                = model.train_eg
    expected_grads_op       = model.expected_grads_op
    background_reference_pl = model.background_reference_pl
    
    image_names = ['house_finch', 'rubber_eraser', 'goldfinch', 'killer_whale']
    for i in range(len(image_names)):
        name = image_names[i]
        print('Running pipeline on image `{}`'.format(name))
        image_input = images[i]
        label_input = labels[i]
        image_input = np.expand_dims(image_input, axis=0)
        label_input = np.expand_dims(label_input, axis=0)

        means_df = means_df_base[means_df_base['image_index'] == i].copy()
        
        selected_logit = logits[:, label_input[0]]
        
        color_mask = np.zeros([299, 299, 3], dtype=np.int64)
        for k in np.unique(segmentation[i]):
            selected_row = means_df.loc[means_df['cluster_index'] == k]
            color_mask[segmentation[i] == k, 0] = selected_row.loc[:, 'r'].values[0]
            color_mask[segmentation[i] == k, 1] = selected_row.loc[:, 'g'].values[0]
            color_mask[segmentation[i] == k, 2] = selected_row.loc[:, 'b'].values[0]
        
        color_mask_float = normalize(color_mask, _domain=[0.0, 255.0], _range=[0.0, 1.0])
        scipy.misc.toimage(color_mask_float, cmin=0.0, cmax=1.0).save('data/slic_mask.png')
        
        means_df = means_df.reset_index(drop=True)
        
        for index, row in tqdm(means_df.iterrows(), total=means_df.shape[0]):        
            selection_mask = np.zeros([299, 299], dtype=np.float32)

            k = row['cluster_index']
            r_map = np.ones([1, 299, 299, 1]) * row['r']
            g_map = np.ones([1, 299, 299, 1]) * row['g']
            b_map = np.ones([1, 299, 299, 1]) * row['b']
            reference_image = np.concatenate([r_map, g_map, b_map], axis=-1)
            input_reference = normalize(reference_image, _domain=[0.0, 255.0], _range=[-1.0, 1.0])
            display_reference = normalize(reference_image, _domain=[0.0, 255.0], _range=[0.0, 1.0])
            selection_mask[segmentation[i] == k] = 1

            alpha_mask = selection_mask * 0.8 + 0.2
            alpha_image = normalize(image_input.squeeze())
            alpha_image = mark_boundaries(alpha_image, selection_mask.astype(int), mode='thick')

            selected_slic_mask = color_mask_float
            selected_slic_mask = mark_boundaries(selected_slic_mask, selection_mask.astype(int), mode='thick')

            background_reference_images = np.tile(np.expand_dims(input_reference, axis=0), [51, 1, 1, 1])
            ig_weights = sess.run(expected_grads_op, feed_dict={
                images_pl: image_input,
                background_reference_pl: background_reference_images,
                train_eg: True,
                labels_pl: label_input
            })
            sum_ig_weights = np.sum(ig_weights, axis=-1)
            sum_abs_ig_weights = np.abs(sum_ig_weights)
            ig_im = norm_clip(sum_abs_ig_weights.squeeze())
            
            scipy.misc.toimage(display_reference.squeeze(), cmin=0.0, cmax=1.0).save('data/{}/slic/reference_{}.png'.format(name, k))
            scipy.misc.toimage(selected_slic_mask.squeeze(), cmin=0.0, cmax=1.0).save('data/{}/slic/slic_mask_{}.png'.format(name, k))
            scipy.misc.toimage(alpha_image.squeeze(), cmin=0.0, cmax=1.0).save('data/{}/slic/slic_image_{}.png'.format(name, k))
            scipy.misc.toimage(ig_im.squeeze()).save('data/{}/slic/ig_weights_{}.png'.format(name, k))
        
        
def get_acc_ig_weights(model, sess):
    print('Running accumulated gradients...')
    images = np.load('data/images.npy')
    labels = np.load('data/labels.npy')
    segmentation = np.load('data/segmentation.npy')
    means_df = pd.read_csv('data/cluster_means.csv')
    
    image_op    = model.image_op
    images_pl   = model.images_pl
    labels_pl   = model.labels_pl
    label_op    = model.label_op
    logits      = model.logits
    pred_labels = model.pred_labels
    
    delta_pl = tf.placeholder(tf.float32, [None, 299, 299, 3])

    explainer = ops.TFOpsExplainer()
    grad_op = explainer._grad_across_multi_output(output_tensor=logits, input_tensor=images_pl, sparse_labels_op=labels_pl)
    grad_input_op = grad_op * delta_pl
    
    alpha_range = np.linspace(0.0, 1.0, num=51)
    alpha_range = np.rint(alpha_range * 100) / 100.0
    
    image_names = ['house_finch', 'rubber_eraser', 'goldfinch', 'killer_whale']
    for i in range(len(image_names)):
        name = image_names[i]
        print('Running pipeline on image `{}`'.format(name))
        image_input = images[i]
        label_input = labels[i]

        image_input = np.expand_dims(image_input, axis=0)
        label_input = np.expand_dims(label_input, axis=0)
    
        reference = np.zeros([1, 299, 299, 3]) - 1.0
        raw_weights_acc = []
        interp_inputs_acc = []
        
        print('Getting ig weights for each alpha value...')
        for alpha in tqdm(alpha_range):
            interp_input = alpha * image_input + (1.0 - alpha) * reference
            interp_input = np.clip(interp_input, a_min=-1.0, a_max=1.0)
            ig_sample = sess.run(grad_input_op, feed_dict = {images_pl: interp_input, 
                                                             labels_pl: label_input,
                                                             delta_pl:  image_input - reference})
            raw_weights_acc.append(ig_sample)
            
            ig_sample = ig_sample.sum(axis=-1)
            ig_sample = np.abs(ig_sample)
            interp_inputs_acc.append(interp_input)

        raw_weights_acc = np.array(raw_weights_acc).squeeze()
        interp_inputs_acc = np.array(interp_inputs_acc).squeeze()

        ig_weights_cu = np.cumsum(raw_weights_acc, axis=0)
        ig_weights_cu = np.sum(ig_weights_cu, axis=-1)
        ig_weights_cu = np.abs(ig_weights_cu)
        divisor = np.arange(ig_weights_cu.shape[0]) + 1
        divisor = divisor[:, np.newaxis, np.newaxis]
        ig_weights_cu = ig_weights_cu / divisor

        print('Saving ig weight images as png files...')
        for i in tqdm(range(len(alpha_range))):
            alpha = alpha_range[i]
            alpha = np.rint(alpha * 100) / 100.0
            weights = raw_weights_acc[i]
            weights = np.abs(np.sum(weights, axis=-1))
            im_weights = norm_clip(weights)
            interp  = interp_inputs_acc[i]
            scipy.misc.toimage(im_weights).save('data/{}/integrated_gradients/point_weights_{}.png'.format(name, alpha))
            scipy.misc.toimage(interp, cmin=-1.0, cmax=1.0).save('data/{}/integrated_gradients/interpolated_image_{}.png'.format(name, alpha))

            weights = ig_weights_cu[i]
            im_weights = norm_clip(weights)
            scipy.misc.toimage(im_weights).save('data/{}/integrated_gradients/cumulative_weights_{}.png'.format(name, alpha))

        logit_out = sess.run(logits, feed_dict={images_pl: image_input})
        baseline_logit_out = sess.run(logits, feed_dict={images_pl: reference})

        output_val = logit_out[0, label_input[0]]
        baseline_output_val = baseline_logit_out[0, label_input[0]]
        target_sum = output_val - baseline_output_val

        raw_ig = np.mean(raw_weights_acc, axis=0)
        raw_weights_acc_sum = np.sum(raw_weights_acc, axis=(1,2,3))

        raw_weights_cu = np.cumsum(raw_weights_acc, axis=0)
        divisor = np.arange(raw_weights_cu.shape[0]) + 1
        divisor = divisor[:, np.newaxis, np.newaxis, np.newaxis]
        raw_weights_cu = raw_weights_cu / divisor
        raw_weights_sum = np.sum(raw_weights_cu, axis=(1,2,3))

        data = pd.DataFrame({
            'cumulative_sum': list(raw_weights_sum) + [target_sum] * len(alpha_range),
            'alpha': list(alpha_range) * 2,
            'method': ['IG'] * len(alpha_range) + ['Target'] * len(alpha_range)
        })

        data.to_csv('data/{}/integrated_gradients/cumulative_sums.csv'.format(name), index=False)

def main(argv=None):
    image_names = ['house_finch', 'rubber_eraser', 'goldfinch', 'killer_whale']
    for name in image_names:
        os.makedirs('data/{}/integrated_gradients/'.format(name) , exist_ok=True)
        os.makedirs('data/{}/slic/'.format(name) , exist_ok=True)
    
    if FLAGS.run == 'slic': 
        model, sess = get_model()
        get_ig_weights_slic(model, sess)
    elif FLAGS.run == 'acc':
        model, sess = get_model()
        get_acc_ig_weights(model, sess)
    elif FLAGS.run == 'csv':
        get_slic_as_csv()
    elif FLAGS.run == 'logits':
        get_logits_and_names()
    elif FLAGS.run == 'eg_pair':
        model, sess = get_model()
        get_eg_pairwise(model, sess)
    elif FLAGS.run == 'eg_samples':
        model, sess = get_model('train')
        get_eg_samples(model, sess)
    else:
        raise ValueError('Invalid argument value `{}` for flag `run`'.format(FLAGS.run))
        
if __name__ == '__main__':
    tf.app.run()