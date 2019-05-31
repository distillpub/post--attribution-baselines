var margin = ({
    top: 30,
    right: 30,
    bottom: 30,
    left: 30
});

image_size = 299;
image_padding = 30;
num_images = 4;

width = num_images * image_size + (num_images - 1) * image_padding;
height = image_size;

var container = d3.select('body')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

var image_group = container
    .append('g')
    .attr('id', 'image_group')
    .attr('width', width)
    .attr('height', image_size)
    .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
var base_link = 'data_gen/data/ig_weights_slic/'
image_data = [
    { x: 0, y: 0, id: 'reference_image', link: base_link + 'references/reference_0.png'},
    { x: image_size + image_padding, y: 0, id: 'slic_image', link: base_link + 'masks/slic_mask_0.png'},
    { x: 2 * (image_size + image_padding), y: 0, id: 'image', link: base_link + 'images/slic_image_0.png'},
    { x: 3 * (image_size + image_padding), y: 0, id: 'ig_weights', link: base_link + 'ig_weights/ig_weights_0.png'},
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
    
var reference_image = image_group.select('#reference_image');
var slic_image = image_group.select('#slic_image');
var image = image_group.select('#image');
var ig_weights = image_group.select('#ig_weights');

d3.json('data_gen/data/segmentation_dict.json').then(function(data) {
    function handle_mouseover(d, i, enter_svg) {
        var coordinates = d3.mouse(enter_svg.node());
        var y = coordinates[0] - enter_svg.attr('x');
        var x = coordinates[1] - enter_svg.attr('y');
        
        var cluster = 0;
        if (x in data) {
            if (y in data[x]) {
                cluster = data[x][y];
            }
        }
        
        reference_image.attr('xlink:href', base_link + `references/reference_${cluster}.png`);
        slic_image.attr('xlink:href', base_link + `masks/slic_mask_${cluster}.png`);
        image.attr('xlink:href', base_link + `images/slic_image_${cluster}.png`);
        ig_weights.attr('xlink:href', base_link + `ig_weights/ig_weights_${cluster}.png`);
    }
    
    function handle_mouseout(d, i, enter_svg) {
        reference_image.attr('xlink:href', base_link + `references/reference_${cluster}.png`);
        slic_image.attr('xlink:href', base_link + `masks/slic_mask_${cluster}.png`);
        image.attr('xlink:href', base_link + `images/slic_image_${cluster}.png`);
        ig_weights.attr('xlink:href', base_link + `ig_weights/ig_weights_${cluster}.png`);
    }

    slic_image.on('mousemove', function(d, i) { handle_mouseover(d, i, slic_image) });
    image.on('mousemove', function(d, i) { handle_mouseover(d, i, image) });
});
