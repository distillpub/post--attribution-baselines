function figure_decoy_mnist() {
    var margin = ({
        top: 30,
        right: 30,
        bottom: 30,
        left: 30
    });

    var left_text_width = 100;
    var left_text_right_padding = 10;

    var image_size    = 50;
    var image_padding = 2;

    var num_columns = 10;
    var num_rows    = 3;
    var image_width  = num_columns * image_size + (num_columns - 1) * image_padding;
    var image_height = num_rows * image_size + (num_rows - 1) * image_padding;

    var base_dir = '../data_gen/decoy_mnist_examples/images/';
    
    var image_data  = [];
    var image_types = ['decoy', 'edges', 'saliency'];
    for (var j = 0; j <= 9; ++j) {
        for (k in image_types) {
            image_data.push({
                x: j * (image_size + image_padding),
                y: k * (image_size + image_padding),
                id: image_types[k] + j,
            });
        }
    }
    
    var text_data = [
        { x: left_text_width, y: image_size / 2 + 3, 
            id: 'decoy_mnist_label', text: 'Original Image:'},
        { x: left_text_width, y: image_size + image_padding + image_size / 2+ 3, 
            id: 'edges_mnist_label', text: 'Edge Detection:'},
        { x: left_text_width, y: 2 * (image_size + image_padding) + image_size / 2 + 3, 
            id: 'saliency_mnist_label', text: 'Expected Gradients:'},
    ];

    var container = d3.select('#figure_decoy_mnist_div')
                        .append('svg')
                        .attr('width',  '100%')
                        .attr('height', '100%')
                        .style('min-width', `${(image_width + left_text_width + left_text_right_padding 
                            + margin.left + margin.right) / 2}px`)
                        // .style('max-width', `${width + margin.left + margin.right}px`)
                        .attr('viewBox', `0 0 ${image_width + left_text_width + left_text_right_padding 
                            + margin.left + margin.right} 
                            ${image_height + margin.top + margin.bottom}`);

    function text_init(text_data) {
        var text_group = container.append('g')
            .attr('id', 'text_group_decoy_mnist')
            .attr('width',  left_text_width)
            .attr('height', image_height)
            .attr('transform', `translate(${margin.left}, 
                ${margin.top})`);
        
        var text = text_group.selectAll('text').data(text_data);
        
        text.enter()
            .append('text')
            .text(function(d) { return d.text })
            .attr('id', function(d) { return d.id ; })
            .attr('x', function(d) { return d.x; })
            .attr('y', function(d) { return d.y; })
            .style("text-anchor", "end")
            .style("font-weight", 700)
            .style('font-size', '14px');
    }

    function image_init(image_data) {
        var image_group = container
            .append('g')
            .attr('id', 'image_group_decoy_mnist')
            .attr('width',  image_width)
            .attr('height', image_height)
            .attr('transform', `translate(${margin.left + left_text_width + left_text_right_padding}, 
                ${margin.top})`);
            
        var images = image_group.selectAll('image').data(image_data);
        
        //Main Images
        images.enter()
            .append('image')
            .attr('width', image_size)
            .attr('height', image_size)
            .attr('xlink:href', function(d) {
                return base_dir + d.id + '.png'
            })
            .attr('id', function(d) { return d.id ; })
            .attr('x', function(d) { return d.x; })
            .attr('y', function(d) { return d.y; });
    }

    image_init(image_data);
    text_init(text_data);
}

figure_decoy_mnist();