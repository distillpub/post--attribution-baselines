#!/usr/bin/env bash

tmux new-session -d -s blur '
export CUDA_VISIBLE_DEVICES=0; 
python ablation_study.py --num_samples 1000 --saliency_type blur --ablation_type mean;
python ablation_study.py --num_samples 1000 --saliency_type blur --ablation_type blur;
python ablation_study.py --num_samples 1000 --saliency_type blur --ablation_type mean_center;
python ablation_study.py --num_samples 1000 --saliency_type blur --ablation_type blur_center;
read
'

tmux new-session -d -s eg '
export CUDA_VISIBLE_DEVICES=1; 
python ablation_study.py --num_samples 1000 --saliency_type eg --ablation_type mean;
python ablation_study.py --num_samples 1000 --saliency_type eg --ablation_type blur;
python ablation_study.py --num_samples 1000 --saliency_type eg --ablation_type mean_center;
python ablation_study.py --num_samples 1000 --saliency_type eg --ablation_type blur_center;
read
'

tmux new-session -d -s ig '
export CUDA_VISIBLE_DEVICES=1; 
python ablation_study.py --num_samples 1000 --saliency_type ig --ablation_type mean;
python ablation_study.py --num_samples 1000 --saliency_type ig --ablation_type blur;
python ablation_study.py --num_samples 1000 --saliency_type ig --ablation_type mean_center;
python ablation_study.py --num_samples 1000 --saliency_type ig --ablation_type blur_center;
read
'

tmux new-session -d -s gaussian '
export CUDA_VISIBLE_DEVICES=2; 
python ablation_study.py --num_samples 1000 --saliency_type gaussian --ablation_type mean;
python ablation_study.py --num_samples 1000 --saliency_type gaussian --ablation_type blur;
python ablation_study.py --num_samples 1000 --saliency_type gaussian --ablation_type mean_center;
python ablation_study.py --num_samples 1000 --saliency_type gaussian --ablation_type blur_center;
read
'

tmux new-session -d -s uniform '
export CUDA_VISIBLE_DEVICES=3; 
python ablation_study.py --num_samples 1000 --saliency_type uniform --ablation_type mean;
python ablation_study.py --num_samples 1000 --saliency_type uniform --ablation_type blur;
python ablation_study.py --num_samples 1000 --saliency_type uniform --ablation_type mean_center;
python ablation_study.py --num_samples 1000 --saliency_type uniform --ablation_type blur_center;
read
'