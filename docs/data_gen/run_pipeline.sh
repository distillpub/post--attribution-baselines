#!/usr/bin/env bash

python3 ig_pipeline.py --run csv
python3 ig_pipeline.py --run logits

tmux new-session -d -s acc '
export CUDA_VISIBLE_DEVICES=0; 
python3 ig_pipeline.py --run acc; read
'

tmux new-session -d -s slic '
export CUDA_VISIBLE_DEVICES=1; 
python3 ig_pipeline.py --run slic; read
'

tmux new-session -d -s eg_pair '
export CUDA_VISIBLE_DEVICES=2; 
python3 ig_pipeline.py --run eg_pair; read
'

tmux new-session -d -s eg_samples '
export CUDA_VISIBLE_DEVICES=3; 
python3 ig_pipeline.py --run eg_samples; read
'