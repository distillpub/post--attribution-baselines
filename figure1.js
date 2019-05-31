var margin = ({
    top: 30,
    right: 30,
    bottom: 30,
    left: 30
});

image_size = 300;
image_padding = 30;
slider_padding = 60;
chart_padding = 80;
chart_height = 300;
chart_width = 300;

slider_height = 200;
width = 3 * image_size + image_padding + chart_padding;
height = image_size + slider_height + slider_padding;

var interp_im_dir = 'data_gen/data/ig_weights_acc/';
var grad_dir = 'data_gen/data/ig_weights_acc/';

image_data = [
    { x: 0, y: 0, id: "interp_alpha"},
    { x: image_size + image_padding, y: 0, id: "weights_alpha"}
];

var prev_alpha = 0.0;

var container = d3.select('body')
                    .append('svg')
                    .attr('width', width + margin.left + margin.right)
                    .attr('height', height + margin.top + margin.bottom + slider_padding);

var image_group = container
    .append('g')
    .attr('id', 'image_group')
    .attr('width', width)
    .attr('height', image_size)
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

var line_chart = image_group
    .append('g')
    .attr('id', 'line_chart')
    .attr('width', chart_width)
    .attr('height', chart_height)
    .attr('transform', `translate(${2 * image_size + image_padding + chart_padding}, 0)`);

line_chart.append('text')
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - chart_padding / 2 - 10)
    .attr("x", 0 - chart_height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Cumulative Sum of Gradients");
    
line_chart.append("text")             
  .attr("transform", `translate(${(chart_width / 2)}, ${(chart_height + chart_padding / 2)})`)
  .style("text-anchor", "middle")
  .text("Interpolation Constant (α)");

line_chart.append("text")
  .attr("transform", `translate(${(chart_width) / 2}, -10)`)
  .style("text-anchor", "middle")
  .style("font-weight", 700)
  .text("Accumulation of Gradient Magnitudes over α");
      
var chart_svg_border = image_group
    .append('g')
    .attr('id', 'chart_svg_border')
    .attr('transform', `translate(${2 * image_size + image_padding + chart_padding - 5}, -5)`)
    .append('svg')
    .attr('width', chart_width + 10)
    .attr('height', chart_height + 10);

var chart_markings = chart_svg_border
    .append('g')
    .attr('id', 'chart_markings')
    .attr('transform', `translate(5, 5)`)

container.selectAll('text').style("font-family", "sans-serif");

function filter_method(row, method) {
    return row.method == method;
}

function alpha_less(row, alpha) {
    return +Number((+row.alpha).toFixed(2)) <= alpha;
}

function image_init(image_data) {
    var images = image_group.selectAll('image').data(image_data);
    
    //Enter phase
    images.enter()
        .append('image')
        .attr('width', image_size)
        .attr('height', image_size)
        .attr('xlink:href', function(d) {
            if (d.id === 'weights_alpha') {
                return grad_dir + d.id + '0.02.png'
            } else {
                return interp_im_dir + d.id + '0.02.png';
            }})
        .attr('id', function(d) { return d.id; })
        .attr('x', function(d) { return d.x; })
        .attr('y', function(d) { return d.y; });
        
    //Exit phase
    images.exit().remove();
}

function update_images(alpha_val) {
    alpha_val = Number((alpha_val).toFixed(2));
    if (alpha_val == 0.0) {
        alpha_val = '0.0';
    }
    else if (alpha_val == 1.0) {
        alpha_val = '1.0';
    }
    var interp_file = interp_im_dir + 'interp_alpha' + alpha_val + '.png';
    var interp_image = image_group.select('#interp_alpha');
    interp_image.attr('xlink:href', interp_file)
    
    var weights_file = grad_dir + 'weights_alpha' + alpha_val + '.png';
    var weights_image = image_group.select('#weights_alpha');
    weights_image.attr('xlink:href', weights_file)
}

function draw_chart(data) {
    var alpha_domain = [0.0, 0.02];
    var sum_domain = d3.extent(data, function(d) { return +d.cumulative_sum; });
    
    cu_data = data.filter(function(d) { return filter_method(d, 'IG'); });
    baseline_data = data.filter(function(d) { return filter_method(d, 'Target'); });
    
    var x = d3.scaleLinear()
        .range([0, image_size])
        .domain(alpha_domain);
        
    var y = d3.scaleLinear()
        .range([image_size, 0])
        .domain(sum_domain);
        
    var xaxis = line_chart.append('g')
        .attr('class', 'axis axis--x')
        .attr('transform', `translate(0, ${image_size})`)
        .attr('id', 'chart-x-axis')
        .call(d3.axisBottom(x));
    
    var yaxis = line_chart.append('g')
        .attr('class', 'axis axis--y')
        .attr('id', 'chart-y-axis')
        .call(d3.axisLeft(y));
        
    line_chart.append('g')
        .attr('id', 'grid_markings')    
        .selectAll('line.horizontalGrid').data(y.ticks()).enter()
        .append('line')
        .attr('class', 'horizontalGrid')
        .attr('x1', 0)
        .attr('x2', image_size)
        .attr('y1', function(d) { return y(d) + 0.5; })
        .attr('y2', function(d) { return y(d) + 0.5; })
        .attr('shape-rendering', 'crispEdges')
        .attr('fill', 'none')
        .attr('stroke', 'gray')
        .attr('stroke-width', '1px');
        
    // line_chart.selectAll('line.verticalGrid').data(x.ticks()).enter()
    //     .append('line')
    //     .attr('class', 'verticalGrid')
    //     .attr('y1', 0)
    //     .attr('y2', image_size)
    //     .attr('x1', function(d) { return x(d) + 0.5; })
    //     .attr('x2', function(d) { return x(d) + 0.5; })
    //     .attr('shape-rendering', 'crispEdges')
    //     .attr('fill', 'none')
    //     .attr('stroke', 'gray')
    //     .attr('stroke-width', '1px');
    
    var line = d3.line()
        .x(function(d) { return x(+d.alpha) })
        .y(function(d) { return y(+d.cumulative_sum)});
        
    var line1 = d3.line()
        .x(function(d) { return x(+d.alpha) })
        .y(function(d) { return y(+d.cumulative_sum)});
    
    chart_markings.append('path')
        .datum(cu_data)
        .attr('id', 'line_mark')
        .attr('class', 'line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', 'firebrick')
        .attr('stroke-width', 2);

    chart_markings.append('path')
        .datum(baseline_data)
        .attr('id', 'target_line')
        .attr('class', 'line')
        .attr('d', line1)
        .attr('fill', 'none')
        .attr('stroke', 'darkblue')
        .attr('stroke-width', 2);
        
    chart_markings.selectAll('circle').data(cu_data) 
        .enter()  
        .append('circle')
        .attr('fill', 'firebrick')
        .attr('stroke', 'none')
        .attr('cx', function(d) { return x(Number((+d.alpha).toFixed(2))); })
        .attr('cy', function(d) { return y(+d.cumulative_sum); })
        .attr('r', 3);

    image_init(image_data);
    
    function update_chart(alpha_val) {
        var transition_duration = 0.0;
        
        if (Math.abs(alpha_val - prev_alpha) > 0.1) {
            transition_duration = 500 * Math.abs(alpha_val - prev_alpha);
        }
        
        var axis_transition = d3
            .transition()
            .duration(transition_duration);
        var mark_transition = d3
            .transition()
            .duration(transition_duration);
                
        var xaxis = line_chart.select('#chart-x-axis');
        
        var alpha_domain = [0.0, alpha_val];
        var x = d3.scaleLinear()
            .range([0, image_size])
            .domain(alpha_domain);
        xaxis.transition(axis_transition).call(d3.axisBottom(x));
        
        var x = d3.scaleLinear()
            .range([0, image_size])
            .domain(alpha_domain);
        
        var line = d3.line()
            .x(function(d) { return x(+d.alpha) })
            .y(function(d) { return y(+d.cumulative_sum)});
        
        chart_markings.select('#line_mark')
            .datum(cu_data)
            .transition(mark_transition)
            .attr('d', line);
            
        chart_markings.select('#target_line')
            .datum(baseline_data)
            .transition(mark_transition)
            .attr('d', line);
        
        var circle_marks = chart_markings
            .selectAll('circle')
            .data(cu_data);
            
        circle_marks
            .exit()
            .transition(mark_transition)
            .attr('cx', function(d) { return x(Number((+d.alpha).toFixed(2))); })
            .attr('cy', function(d) { return y(+d.cumulative_sum); })
            .remove();
        
        circle_marks
            .transition(mark_transition)
            .attr('cx', function(d) { return x(Number((+d.alpha).toFixed(2))); })
            .attr('cy', function(d) { return y(+d.cumulative_sum); });
            
        circle_marks.enter()
            .append('circle')
            .attr('fill', 'firebrick')
            .attr('stroke', 'none')
            .attr('r', 3)
            .transition(mark_transition)
            .attr('cx', function(d) { return x(Number((+d.alpha).toFixed(2))); })
            .attr('cy', function(d) { return y(+d.cumulative_sum); });
                
        prev_alpha = alpha_val;
    }

    slider_group = container
        .append('g')
        .attr('id', 'slider_group')
        .attr('width', width - 2 * slider_padding)
        .attr('height', slider_height)
        .attr('transform', `translate(${margin.left + slider_padding}, ${margin.top + image_size + slider_padding})`);

    var slider = d3
        .sliderHorizontal()
        .min(0.02)
        .max(1.0)
        .step(0.02)
        .ticks(5)
        .width(width - 2 * slider_padding)
        .default(0.0)
        .on('onchange', function(alpha_value) {
            update_images(alpha_value);
            update_chart(alpha_value);
        });

    slider_group
        .call(slider);
}

d3.csv('data_gen/data/alpha_cu_sum.csv').then(function(data) { draw_chart(data) });