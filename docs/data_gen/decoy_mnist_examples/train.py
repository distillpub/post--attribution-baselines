import tensorflow as tf
import os
from data import decoy_mnist
from model import build_model

from absl import app
from absl import flags

FLAGS = flags.FLAGS

flags.DEFINE_integer('batch_size', 50, 'Batch size for training and evaluation')
flags.DEFINE_integer('num_epochs', 100, 'Number of epochs to train for')
flags.DEFINE_float('learning_rate', 0.01, 'Initial learning rate to use while training')
flags.DEFINE_boolean('alter_test', False, 'Set to False to keep the original (unaltered) test data')

def set_up_environment(mem_frac=None):
    tf.enable_eager_execution()
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
    gpus = tf.config.experimental.list_physical_devices('GPU')
    if gpus:
        try:
            for gpu in gpus:
                if mem_frac is not None:
                    memory_limit = int(10000 * mem_frac)
                    tf.config.experimental.set_virtual_device_configuration(
                        gpu,
                    [tf.config.experimental.VirtualDeviceConfiguration(memory_limit=memory_limit)])
                else:
                    tf.config.experimental.set_memory_growth(gpu, True)
        except RuntimeError as e:
            print(e)

def train(argv=None):
    model = build_model()
    x_train, y_train, x_test, y_test = decoy_mnist(alter_test=FLAGS.alter_test)
    
    optimizer = tf.keras.optimizers.SGD(learning_rate=FLAGS.learning_rate)
    model.compile(optimizer=optimizer,
                  loss=tf.keras.losses.SparseCategoricalCrossentropy(),
                  metrics=[tf.keras.metrics.SparseCategoricalAccuracy()])
    model.fit(x_train, y_train, 
              batch_size=FLAGS.batch_size, 
              epochs=FLAGS.num_epochs, 
              validation_data=(x_test, y_test))
    model.save('saved_model.h5')

if __name__ == '__main__':
    set_up_environment()
    app.run(train)