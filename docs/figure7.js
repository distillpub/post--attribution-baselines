var margin = ({
    top: 60,
    right: 30,
    bottom: 30,
    left: 30
});

image_size = 300;

indicator_image_size = 75;
indicator_image_padding = 10;
indicator_box_top_padding = 25;

image_padding = 30;

num_images = 3;
width = num_images * image_size + (num_images - 1) * image_padding;
height = image_size + indicator_image_size + indicator_image_padding + indicator_box_top_padding;

var base_image_name = 'goldfinch';
var base_dir = `data_gen/data/${base_image_name}/`;

image_data = [
    { x: 0, y: 0, id: 'display_image', title: 'Predicted Class: ' + base_image_name},
    { x: image_size + image_padding, y: 0, id: 'ig_weights', title: 'Integrated Gradients Attribution Maps'},
    { x: 2 * (image_size + image_padding), y: 0, id: 'eg_weights', title: 'Expected Gradients Attribution Maps'},
];

indicator_data = [
    { x: 0, y: 0, id: 'goldfinch', opacity: 1.0},
    { x: indicator_image_size + indicator_image_padding, y: 0, id: 'rubber_eraser', opacity: 0.2 },
    { x: 2 * (indicator_image_size + indicator_image_padding), y: 0, id: 'house_finch', opacity: 0.2 },
    { x: 3 * (indicator_image_size + indicator_image_padding), y: 0, id: 'killer_whale', opacity: 0.2 }
]

var container = d3.select('body')
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

image_group
    .selectAll('text')
    .data(image_data)
    .enter()
    .append('text')
    .attr('id', function(d) { return d.id + '_title' })
    .style("text-anchor", "middle")
    .style("font-weight", 700)
    .text(function(d) { return d.title })
    .attr('x', function(d) { return (image_size / 2) + d.x })
    .attr('y', -10);

var display_text = image_group
    .select('#display_image_title');

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
    .text('Click to select a different ImageNet image:');

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
    base_dir = `data_gen/data/${base_image_name}/`;

    var display_image = image_group.select('#display_image');
    var weights_image = image_group.select('#ig_weights');
    var eg_image = image_group.select('#eg_weights');
    
    var interp_file = base_dir + 'integrated_gradients/interpolated_image_1.0.png';
    var weights_file = base_dir + 'integrated_gradients/cumulative_weights_1.0.png';
    var eg_file = base_dir + 'eg_samples/cumulative_weights_50.png';
    
    cross_fade_image(display_image, interp_file, image_group, 500);
    cross_fade_image(weights_image, weights_file, image_group, 500);
    cross_fade_image(eg_image, eg_file, image_group, 500);
    
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
            if (d.id === 'display_image') {
                return base_dir + 'integrated_gradients/interpolated_image_1.0.png';
            } else if (d.id === 'ig_weights') {
                return base_dir + 'integrated_gradients/cumulative_weights_1.0.png';
            } else if (d.id === 'eg_weights') {
                return base_dir + 'eg_samples/cumulative_weights_50.png';
            }
            else {
                return '404.png';
            }
        })
        .attr('id', function(d) { return d.id; })
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
        .attr('id', function(d) { return d.id; })
        .attr('x', function(d) { return d.x; })
        .attr('y', function(d) { return d.y; })
        .attr('opacity', function(d) { return d.opacity; })
        .on('click', select_new_image);
}

image_init(image_data);