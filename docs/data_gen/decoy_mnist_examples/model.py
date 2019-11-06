import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, Activation, Flatten, Input
from tensorflow.keras.layers import Conv2D, MaxPooling2D, BatchNormalization
from tensorflow.keras import regularizers
from tensorflow.contrib.slim.nets import vgg

def build_model(input_shape=(28, 28, 1)):    
    model = Sequential()
    
    model.add(Input(shape=input_shape, dtype=tf.float32))
#     model.add(Conv2D(32, (3, 3), padding='same'))
#     model.add(Activation('relu'))
    
#     model.add(Conv2D(64, (3, 3), padding='same'))
#     model.add(Activation('relu'))
    
    model.add(Flatten())
    model.add(Dense(1024))
    model.add(Activation('relu'))
    model.add(Dense(512))
    model.add(Activation('relu'))

    model.add(Dense(10))
    model.add(Activation('softmax'))
    return model