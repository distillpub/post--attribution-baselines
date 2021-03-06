
# Visualizing the Impact of Feature Attribution Baselines

This is the repository for the article: https://distill.pub/2020/attribution-baselines/

[Integrated Gradients](https://arxiv.org/pdf/1703.01365) has become a popular method for
interpreting deep neural networks. As a hyper-parameter, the method requires
the user to choose a baseline input x' that the explanations are relative to.
What does the baseline input mean? And how important is it? In this article, we explore this hyper-parameter, and argue
that, although it is often over-looked, it is an important
hyper-parameter. We use the example of an image classification network
to demonstrate why this hyper-parameter can impact how
you interpret your networks. Finally, we discuss how this choice of hyper-parameter relates to a broader
understanding of how we interpret machine learning models, and what it means
to represent missingness to a model.

Note: the `public/` folder in this repository contains a static webpage. Simply clone it, enter the directory and start up a server (something like `python3 -m http.server` in the repo directory) to view.
