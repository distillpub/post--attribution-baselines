function figure4() {
    var margin = ({
        top: 30,
        right: 30,
        bottom: 30,
        left: 30
    });

    var image_size = 299;
    var image_padding = 30;
    var num_images = 4;

    var indicator_image_size = 75;
    var indicator_image_padding = 10;
    var indicator_box_top_padding = 25;

    var width = num_images * image_size + (num_images - 1) * image_padding;
    var height = image_size + indicator_image_size + indicator_image_padding + indicator_box_top_padding;

    var current_json = null;

    var indicator_data = [
        { x: 0, y: 0, id: 'goldfinch', opacity: 1.0},
        { x: indicator_image_size + indicator_image_padding, y: 0, id: 'rubber_eraser', opacity: 0.2 },
        { x: 2 * (indicator_image_size + indicator_image_padding), y: 0, id: 'house_finch', opacity: 0.2 },
        { x: 3 * (indicator_image_size + indicator_image_padding), y: 0, id: 'killer_whale', opacity: 0.2 }
    ]

    var container = d3.select('#figure4_div')
        .append('svg')
        .attr('width',  '100%')
        .attr('height', '100%')
        .style('min-width', `${(width + margin.left + margin.right ) / 2}px`)
        .style('max-width', `${width + margin.left + margin.right}px`)
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);

    var image_group = container
        .append('g')
        .attr('id', 'image_group')
        .attr('width', width)
        .attr('height', image_size)
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    var indicator_group = container
        .append('g')
        .attr('id', 'indicator_group')
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
        .text('Click to select a different image:')
        .style("font-family", "sans-serif");

    var base_image_name = 'goldfinch';
    var base_link = 'data_gen/data/' + base_image_name + '/slic/';

    var image_data = [
        { x: 0, y: 0, id: 'reference_image', link: base_link + 'reference_0.png', title: 'Baseline Input x\''},
        { x: image_size + image_padding, y: 0, id: 'slic_image', link: base_link + 'slic_mask_0.png', title: 'Segmented Image'},
        { x: 2 * (image_size + image_padding), y: 0, id: 'image', link: base_link + 'slic_image_0.png', title: 'Original Image'},
        { x: 3 * (image_size + image_padding), y: 0, id: 'ig_weights', link: base_link + 'ig_weights_0.png', title: 'Integrated Gradients Attribution Map'},
    ];

    var images = image_group.selectAll('image').data(image_data);
    images.enter()
        .append('svg:image')
        .attr('width', image_size)
        .attr('height', image_size)
        .attr('xlink:href', function(d) { return d.link; })
        .attr('id', function(d) { return d.id; })
        .attr('x', function(d) { return d.x; })
        .attr('y', function(d) { return d.y; });

    image_group
        .selectAll('text')
        .data(image_data)
        .enter()
        .append('text')
        .attr('id', function(d) { return d.id + '_title' })
        .style("text-anchor", "middle")
        .style("font-weight", 700)
        .style("font-size", '18px')
        .text(function(d) { return d.title })
        .attr('x', function(d) { return (image_size / 2) + d.x })
        .attr('y', -10)
        .style("font-family", "sans-serif");
        
    var reference_image = image_group.select('#reference_image');
    var slic_image = image_group.select('#slic_image');
    var image = image_group.select('#image');
    var ig_weights = image_group.select('#ig_weights');

    function select_new_image(row, i) {
        if (base_image_name === row.id) {
            return;
        }
        
        var indicator_images = indicator_group.selectAll('image').data(indicator_data);
        indicator_images.attr('opacity', function(d) {
            if (row.id == d.id) {
                return 1.0;
            } else {
                return 0.2
            }
        })
        
        base_image_name = row.id;
        base_link = 'data_gen/data/' + base_image_name + '/slic/';
        
        cross_fade_image(reference_image, base_link + `reference_0.png`, image_group, 500);
        cross_fade_image(slic_image, base_link + `slic_mask_0.png`, image_group, 500);
        cross_fade_image(image, base_link + `slic_image_0.png`, image_group, 500);
        cross_fade_image(ig_weights, base_link + `ig_weights_0.png`, image_group, 500);
        // reference_image.attr('xlink:href', base_link + `reference_0.png`);
        // slic_image.attr('xlink:href', base_link + `slic_mask_0.png`);
        // image.attr('xlink:href', base_link + `slic_image_0.png`);
        // ig_weights.attr('xlink:href', base_link + `ig_weights_0.png`);
        
        d3.json(base_link + 'segmentation_dict.json').then(function(data) {
            current_json = data;
        })
    }
        
    var indicator_images = indicator_group.selectAll('image').data(indicator_data);

    indicator_images.enter()
        .append('image')
        .attr('width', indicator_image_size)
        .attr('height', indicator_image_size)
        .attr('xlink:href', function(d) {
            return 'data_gen/data/' + d.id + '/integrated_gradients/interpolated_image_1.0.png';
        })
        .attr('id', function(d) { return d.id; })
        .attr('x', function(d) { return d.x; })
        .attr('y', function(d) { return d.y; })
        .attr('opacity', function(d) { return d.opacity; })
        .on('click', select_new_image);
        
    d3.json(base_link + 'segmentation_dict.json').then(function(data) {
        current_json = data;
        
        function handle_mouseover(d, i, enter_svg) {
            var coordinates = d3.mouse(enter_svg.node());
            var y = Math.round(coordinates[0] - enter_svg.attr('x'));
            var x = Math.round(coordinates[1] - enter_svg.attr('y'));
            
            var cluster = 0;
            if (x in current_json) {
                if (y in current_json[x]) {
                    cluster = current_json[x][y];
                }
            }
            
            reference_image.attr('xlink:href', base_link + `reference_${cluster}.png`);
            slic_image.attr('xlink:href', base_link + `slic_mask_${cluster}.png`);
            image.attr('xlink:href', base_link + `slic_image_${cluster}.png`);
            ig_weights.attr('xlink:href', base_link + `ig_weights_${cluster}.png`);
        }

        slic_image.on('mousemove', function(d, i) { handle_mouseover(d, i, slic_image) });
        image.on('mousemove', function(d, i) { handle_mouseover(d, i, image) });
    });
}

figure4();