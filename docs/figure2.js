function figure2() {
    var margin = ({
        top: 30,
        right: 30,
        bottom: 30,
        left: 30
    });

    var image_size = 300;

    var indicator_image_size = 75;
    var indicator_image_padding = 10;
    var indicator_box_top_padding = 25;

    var image_padding = 30;

    var num_images = 2;
    var width = num_images * image_size + (num_images - 1) * image_padding;
    var height = image_size + indicator_image_size + indicator_image_padding + indicator_box_top_padding;

    var base_image_name = 'goldfinch';
    var base_dir = `data_gen/data/${base_image_name}/integrated_gradients/`;

    var image_data = [
        { x: 0, y: 0, id: 'display_image_fig2', title: 'Predicted Class: ' + base_image_name},
        { x: image_size + image_padding, y: 0, id: 'ig_weights_fig2', title: 'Integrated Gradients Attributions'},
    ];

    var indicator_data = [
        { x: 0, y: 0, id: 'goldfinch', opacity: 1.0},
        { x: indicator_image_size + indicator_image_padding, y: 0, id: 'rubber_eraser', opacity: 0.2 },
        { x: 2 * (indicator_image_size + indicator_image_padding), y: 0, id: 'house_finch', opacity: 0.2 },
        { x: 3 * (indicator_image_size + indicator_image_padding), y: 0, id: 'killer_whale', opacity: 0.2 }
    ]

    var container = d3.select('#figure2_div')
                        .append('svg')
                        .attr('width',  '100%')
                        .attr('height', '100%')
                        .style('min-width', `${(width + margin.left + margin.right ) / 2}px`)
                        .style('max-width', `${width + margin.left + margin.right}px`)
                        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);

    var image_group = container
        .append('g')
        .attr('id', 'image_group_fig2')
        .attr('width', width)
        .attr('height', image_size)
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    image_group
        .selectAll('text')
        .data(image_data)
        .enter()
        .append('text')
        .attr('id', function(d) { return d.id + '_title' })
        .style("text-anchor", "middle")
        .style("font-weight", 700)
        .style('font-size', '18px')
        .text(function(d) { return d.title })
        .attr('x', function(d) { return (image_size / 2) + d.x })
        .attr('y', -10);

    var display_text = image_group
        .select('text');

    var indicator_group = container
        .append('g')
        .attr('id', 'indicator_group_fig2')
        .attr('width', 4 * indicator_image_size + 3 * indicator_image_padding)
        .attr('height', indicator_image_size + indicator_image_padding + image_padding)
        .attr('transform', `translate(${margin.left}, ${margin.top + image_size + 
            image_padding + indicator_box_top_padding})`);

    indicator_group
        .append('text')
        .attr('x', indicator_group.attr('width') / 2)
        .attr('y', -indicator_box_top_padding / 2)
        .attr('text-anchor', 'middle')
        .style('font-weight', 700)
        .style('font-size', '18px')
        .text('Click to select a different image:');

    container.selectAll('text').style("font-family", "sans-serif");

    function select_new_image(row, i) {
        if (base_image_name === row.id) {
            return;
        }
        var indicator_images = indicator_group.selectAll('image').data(indicator_data)
        indicator_images.attr('opacity', function(d) {
            if (row.id == d.id) {
                return 1.0;
            } else {
                return 0.2
            }
        })
        
        base_image_name = row.id;
        base_dir = `data_gen/data/${base_image_name}/integrated_gradients/`;
        
        var display_image = image_group.select('#display_image_fig2');
        var weights_image = image_group.select('#ig_weights_fig2');
        
        var interp_file = base_dir + 'interpolated_image_1.0.png';
        var weights_file = base_dir + 'cumulative_weights_1.0.png';
        
        cross_fade_image(display_image, interp_file, image_group, 500);
        cross_fade_image(weights_image, weights_file, image_group, 500);
        
        var format_name = base_image_name.replace(/_/g, ' ');
        display_text
            .text('Predicted Class: ' + format_name);
    }

    function image_init(image_data) {
        var images = image_group.selectAll('image').data(image_data);
        var indicator_images = indicator_group.selectAll('image').data(indicator_data);
        
        //Main Images
        images.enter()
            .append('image')
            .attr('width', image_size)
            .attr('height', image_size)
            .attr('xlink:href', function(d) {
                if (d.id === 'display_image_fig2') {
                    return base_dir + 'interpolated_image_1.0.png';
                } else if (d.id == 'ig_weights_fig2') {
                    return base_dir + 'cumulative_weights_1.0.png';
                } else {
                    return '404.png';
                }
            })
            .attr('id', function(d) { return d.id ; })
            .attr('x', function(d) { return d.x; })
            .attr('y', function(d) { return d.y; });
        
        //Indicator Images
        indicator_images.enter()
            .append('image')
            .attr('width', indicator_image_size)
            .attr('height', indicator_image_size)
            .attr('xlink:href', function(d) {
                return 'data_gen/data/' + d.id + '/integrated_gradients/interpolated_image_1.0.png';
            })
            .attr('id', function(d) { return d.id + '_fig2'; })
            .attr('x', function(d) { return d.x; })
            .attr('y', function(d) { return d.y; })
            .attr('opacity', function(d) { return d.opacity; })
            .on('click', select_new_image);
    }

    image_init(image_data);
}

figure2();