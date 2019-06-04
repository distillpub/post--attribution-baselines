function cross_fade_image(image_node, new_link, group_node, transition_duration) {
    var new_image = group_node.append('svg:image')
        .attr('id', 'transition_image')
        .attr('width', image_node.attr('width'))
        .attr('height', image_node.attr('height'))
        .attr('xlink:href', image_node.attr('xlink:href'))
        .attr('x', image_node.attr('x'))
        .attr('y', image_node.attr('y'))
        .style('opacity', 1.0);
    
    image_node
        .style('opacity', 0.0)
        .attr('xlink:href', new_link)
        .transition(transition_duration)
        .style('opacity', 1.0);
    
    new_image.transition(transition_duration)
        .style('opacity', 0.0)
        .remove();
}