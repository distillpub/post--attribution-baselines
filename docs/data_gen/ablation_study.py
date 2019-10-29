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