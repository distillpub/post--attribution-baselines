#!/usr/bin/env bash

tmux new-session -d -s blur '
export CUDA_VISIBLE_DEVICES=0; 
python3 baseline_comparisons.py --experiment blur; read
'

tmux new-session -d -s uniform '
export CUDA_VISIBLE_DEVICES=1; 
python3 baseline_comparisons.py --experiment uniform; read
'

tmux new-session -d -s gaussian '
export CUDA_VISIBLE_DEVICES=2; 
python3 baseline_comparisons.py --experiment gaussian; read
'

tmux new-session -d -s max_dist '
export CUDA_VISIBLE_DEVICES=3; 
python3 baseline_comparisons.py --experiment max_dist; read
'