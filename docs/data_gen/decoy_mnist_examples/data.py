import tensorflow as tf
import numpy as np

def decoy_mnist():
    (x_train, y_train), (x_test, y_test) = tf.keras.datasets.mnist.load_data()    
    x_train = x_train.astype('float32')
    x_test  = x_test.astype('float32')

    x_train = np.expand_dims(x_train, axis=-1)
    x_test  = np.expand_dims(x_test, axis=-1)

    # These two lines add the "decoy" part. We are literally
    # encoding the true label into the top left corner of the image.
    x_train[:, :3, :3, :] = y_train[:, np.newaxis, np.newaxis, np.newaxis]
    x_test[:, :3, :3, :]  = y_test[:, np.newaxis, np.newaxis, np.newaxis]

    x_train = x_train * (1. / 255) - 0.5
    x_test  = x_test  * (1. / 255) - 0.5
    return x_train, y_train, x_test, y_test