
# Visualizing the Impact of Feature Attribution Baselines
Article link: https://psturmfels.github.io/VisualizingExpectedGradients/  

[Integrated Gradients](https://arxiv.org/pdf/1703.01365) has become a popular method for
interpreting deep neural networks. As a hyper-parameter, the method requires
the user to choose a baseline input x' that the explanations are relative to.
What does the baseline input mean? And how important is it?

In this article, we explore this hyper-parameter, and argue
that, although it is often over-looked, it is an important
hyper-parameter. We use the example of an image classification network
to demonstrate why this hyper-parameter can impact how
you interpret your networks.

Finally, we explain an extension of Integrated Gradients, 
called Expected Gradients, and how it avoids specifying a baseline input x'.
