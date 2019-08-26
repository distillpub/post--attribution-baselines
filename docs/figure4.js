function figure4() {
    var margin = ({
        top: 30,
        right: 120,
        bottom: 30,
        left: 0
    });

    var image_size = 300;

    var indicator_image_size = 75;
    var indicator_image_padding = 10;
    var indicator_box_top_padding = 25;

    var legend_width = 400;
    var legend_height = 75;
    var legend_right_padding = 50;
    var legend_top_padding = 20;

    var image_padding = 30;
    var slider_padding = 60;
    var slider_text_spacing = 40;
    var chart_padding = 80;
    var chart_height = 300;
    var chart_width = 300;
    var slider_height = 40;

    var num_images = 3;
    var width = (num_images + 1) * image_size + (num_images - 1) * image_padding + chart_padding;
    var height = image_size + slider_height + slider_padding + slider_text_spacing + indicator_image_size;

    var slider_width = width - 2 * slider_padding;

    var current_alpha = 0.0;
    var current_data = null; 

    var base_image_name = 'goldfinch';
    var base_dir = `data_gen/data/${base_image_name}/integrated_gradients/`;
    var interp_im_file = 'interpolated_image_';
    var grad_file = 'point_weights_';
    var cumulative_file = 'cumulative_weights_';

    var image_data = [
        { x: 0, y: 0, id: 'interp_alpha', title: '(1): Interpolated Image'},
        { x: image_size + image_padding, y: 0, id: 'weights_alpha', title: "(2): Gradients at Interpolation"},
        { x: 2*(image_size + image_padding), y: 0, id: 'cumulative_alpha', title: '(3): Cumulative Gradients'}
    ];

    var indicator_data = [
        { x: 0, y: 0, id: 'goldfinch', opacity: 1.0},
        { x: indicator_image_size + indicator_image_padding, y: 0, id: 'rubber_eraser', opacity: 0.2 },
        { x: 2 * (indicator_image_size + indicator_image_padding), y: 0, id: 'house_finch', opacity: 0.2 },
        { x: 3 * (indicator_image_size + indicator_image_padding), y: 0, id: 'killer_whale', opacity: 0.2 }
    ]

    var prev_alpha = 0.0;

    var container = d3.select('#figure4_div')
                        .append('svg')
                        .attr('width',  '100%')
                        .attr('height', '100%')
                        .style('min-width', `${(width + margin.left + margin.right ) / 2}px`)
                        // .style('max-width', `${width + margin.left + margin.right}px`)
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
        .style('font-size', '22px')
        .text(function(d) { return d.title })
        .attr('x', function(d) { return (image_size / 2) + d.x })
        .attr('y', -10);

    var indicator_group = container
        .append('g')
        .attr('id', 'indicator_group')
        .attr('width', 4 * indicator_image_size + 3 * indicator_image_padding)
        .attr('height', indicator_image_size + indicator_image_padding + image_padding)
        .attr('transform', `translate(${margin.left + slider_padding}, ${margin.top + image_size + slider_padding + 
            image_padding + slider_height + indicator_box_top_padding})`);

    indicator_group
        .append('text')
        .attr('x', indicator_group.attr('width') / 2)
        .attr('y', -indicator_box_top_padding / 2)
        .attr('text-anchor', 'middle')
        .style('font-weight', 700)
        .style('font-size', '18px')
        .text('Click to select a different image:')
        
    var line_chart = image_group
        .append('g')
        .attr('id', 'line_chart')
        .attr('width', chart_width)
        .attr('height', chart_height)
        .attr('transform', `translate(${num_images * image_size + (num_images - 1) * image_padding + chart_padding}, 0)`);

    line_chart.append('text')
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - chart_padding / 2 - 10)
        .attr("x", 0 - chart_height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Mean Cumulative Sum of Gradients");
        
    line_chart.append("text")             
      .attr("transform", `translate(${(chart_width / 2)}, ${(chart_height + chart_padding / 2)})`)
      .style("text-anchor", "middle")
      .text("Interpolation Constant (alpha)");

    line_chart.append("text")
      .attr("transform", `translate(${(chart_width) / 2}, -10)`)
      .style("text-anchor", "middle")
      .style("font-weight", 700)
      .style('font-size', '22px')
      .text("(4): Sum of Cumulative Grads");
          
    var chart_svg_border = image_group
        .append('g')
        .attr('id', 'chart_svg_border')
        .attr('transform', `translate(${num_images * image_size + (num_images - 1) * image_padding + chart_padding - 5}, -5)`)
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

    function update_images(alpha_val, transition_duration) {
        alpha_val = Number((Math.floor(alpha_val * 50) / 50).toFixed(2));
        
        var interp_file = base_dir + interp_im_file + alpha_val.toFixed(2) + '.png';
        var interp_image = image_group.select('#interp_alpha');
        
        var weights_file = base_dir + grad_file + alpha_val.toFixed(2) + '.png';
        var weights_image = image_group.select('#weights_alpha');
        
        var acc_file = base_dir + cumulative_file + alpha_val.toFixed(2) + '.png';
        var acc_image = image_group.select('#cumulative_alpha');
        
        if (transition_duration === 0.0) {
            interp_image.attr('xlink:href', interp_file);
            weights_image.attr('xlink:href', weights_file);
            acc_image.attr('xlink:href', acc_file);
        } else {
            cross_fade_image(interp_image, interp_file, image_group, transition_duration);
            cross_fade_image(weights_image, weights_file, image_group, transition_duration);
            cross_fade_image(acc_image, acc_file, image_group, transition_duration);
        }
    }

    function draw_chart(data) {
        current_data = data;
        var alpha_domain = [0.0, Math.max(current_alpha, 0.01)];
        var sum_domain = d3.extent(data, function(d) { return +d.cumulative_sum; });
        sum_domain[1] = sum_domain[1] + 20;
        
        var cu_data = current_data.filter(function(d) { return filter_method(d, 'IG'); });
        var baseline_data = current_data.filter(function(d) { return filter_method(d, 'Target'); });
        
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
            .attr('id', 'grid_markings_3')    
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
            .attr('stroke-width', '1px')
            .attr('stroke-opacity', 0.3);

        var line = d3.line()
            .x(function(d) { return x(+d.alpha) })
            .y(function(d) { return y(+d.cumulative_sum)})
            .curve(d3.curveMonotoneX);
            
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
            
        // chart_markings.selectAll('circle').data(cu_data) 
        //     .enter()  
        //     .append('circle')
        //     .attr('fill', 'firebrick')
        //     .attr('stroke', 'none')
        //     .attr('cx', function(d) { return x(Number((+d.alpha).toFixed(2))); })
        //     .attr('cy', function(d) { return y(+d.cumulative_sum); })
        //     .attr('r', 3);
        
        function update_chart(alpha_val, new_data, new_image) {
            var new_cu_data = new_data.filter(function(d) { return filter_method(d, 'IG'); });
            var new_baseline_data = new_data.filter(function(d) { return filter_method(d, 'Target'); });
            
            var transition_duration = 0.0;
            
            if (new_image) {
                transition_duration = 500;
            }
            else if (Math.abs(alpha_val - prev_alpha) > 0.1) {
                transition_duration = 500 * Math.abs(alpha_val - prev_alpha);
            }
            
            var axis_transition = d3
                .transition()
                .duration(transition_duration);
            var mark_transition = d3
                .transition()
                .duration(transition_duration);
                    
            var xaxis = line_chart.select('#chart-x-axis');
            var yaxis = line_chart.select('#chart-y-axis');
            
            var alpha_domain = [0.0, Math.max(alpha_val, 0.01)];
            var x = d3.scaleLinear()
                .range([0, image_size])
                .domain(alpha_domain);
            
            var sum_domain = d3.extent(current_data, function(d) { return +d.cumulative_sum; });
            sum_domain[1] = sum_domain[1] + 20;
            var y = d3.scaleLinear()
                .range([image_size, 0])
                .domain(sum_domain);
                
            if (new_image) {
                var grid_markings_data = d3.select('#grid_markings_3')
                    .selectAll('line.horizontalGrid')
                    .data(y.ticks());
                
                grid_markings_data.exit()
                    .transition(axis_transition)
                    .attr('y1', 0.0)
                    .attr('y2', 0.0)
                    .style('stroke-opacity', 0)
                    .remove();
                
                grid_markings_data.transition(axis_transition)
                    .attr('y1', function(d) { return y(d) + 0.5; })
                    .attr('y2', function(d) { return y(d) + 0.5; });
                
                grid_markings_data.enter()
                .append('line')
                .attr('class', 'horizontalGrid')
                .attr('x1', 0)
                .attr('x2', image_size)
                .attr('y1', 0.0)
                .attr('y2', 0.0)
                .attr('shape-rendering', 'crispEdges')
                .attr('fill', 'none')
                .attr('stroke', 'gray')
                .attr('stroke-width', '1px')
                .transition(axis_transition)
                .attr('y1', function(d) { return y(d) + 0.5; })
                .attr('y2', function(d) { return y(d) + 0.5; })
                .attr('stroke-opacity', 0.3);
            }
                
            xaxis.transition(axis_transition).call(d3.axisBottom(x));
            yaxis.transition(axis_transition).call(d3.axisLeft(y))
            
            var x = d3.scaleLinear()
                .range([0, image_size])
                .domain(alpha_domain);
            
            var line = d3.line()
                .x(function(d) { return x(+d.alpha) })
                .y(function(d) { return y(+d.cumulative_sum)})
                .curve(d3.curveMonotoneX);
            
            chart_markings.select('#line_mark')
                .datum(new_cu_data)
                .transition(mark_transition)
                .attr('d', line);
                
            chart_markings.select('#target_line')
                .datum(new_baseline_data)
                .transition(mark_transition)
                .attr('d', line);
            
            // var circle_marks = chart_markings
            //     .selectAll('circle')
            //     .data(new_cu_data);
            // 
            // circle_marks
            //     .exit()
            //     .transition(mark_transition)
            //     .attr('cx', function(d) { return x(Number((+d.alpha).toFixed(2))); })
            //     .attr('cy', function(d) { return y(+d.cumulative_sum); })
            //     .remove();
            // 
            // circle_marks
            //     .transition(mark_transition)
            //     .attr('cx', function(d) { return x(Number((+d.alpha).toFixed(2))); })
            //     .attr('cy', function(d) { return y(+d.cumulative_sum); });
            // 
            // circle_marks.enter()
            //     .append('circle')
            //     .attr('fill', 'firebrick')
            //     .attr('stroke', 'none')
            //     .attr('r', 3)
            //     .transition(mark_transition)
            //     .attr('cx', function(d) { return x(Number((+d.alpha).toFixed(2))); })
            //     .attr('cy', function(d) { return y(+d.cumulative_sum); });
                    
            prev_alpha = alpha_val;
        }
            
        slider_group = container
            .append('g')
            .attr('id', 'slider_group')
            .attr('width', width - 2 * slider_padding)
            .attr('height', slider_height)
            .attr('transform', `translate(${margin.left + slider_padding}, ${margin.top + image_size + slider_padding})`);
                
        var slider_label = slider_group
            .append('text')
            .attr('id', 'slider_label')
            .style("text-anchor", "middle")
            .style("font-weight", 700)
            .text(`alpha = ${current_alpha.toFixed(2)}`)
            .attr('x', slider_width / 2)
            .attr('y', slider_text_spacing)
            .attr('font-size', 20)
            .attr('fill', 'black')
            .style('font-size', '22px')
            .style("font-family", "sans-serif");
        
        var slider2 = slid3r()
            .width(width - 2 * slider_padding)
            .range([0.0, 1.0])
            .startPos(current_alpha)
            .clamp(false)
            .label(null)
            .numTicks(6)
            .font('sans-serif')
            .onDrag(function(alpha_value) {
                current_alpha = Number((Math.floor(alpha_value * 50) / 50).toFixed(2));
                slider_label.text(`alpha = ${current_alpha.toFixed(2)}`);
                update_images(current_alpha, 0);
                update_chart(alpha_value, current_data, false);
            });
        
        slider_group.append('g')
            .call(slider2);
        
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
            update_images(current_alpha, 500);
            
            d3.csv(base_dir + 'cumulative_sums.csv').then(function(x) { 
                current_data = x;
                update_chart(current_alpha, x, true);
            });
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
                    if (d.id === 'weights_alpha') {
                        return base_dir + grad_file + '0.00.png';
                    } else if (d.id == 'cumulative_alpha') {
                        return base_dir + cumulative_file + '0.00.png';
                    } else {
                        return base_dir + interp_im_file + '0.00.png';
                    }})
                .attr('id', function(d) { return d.id; })
                .attr('x', function(d) { return d.x; })
                .attr('y', function(d) { return d.y; });
            
            //Indicator Images
            indicator_images.enter()
                .append('image')
                .attr('width', indicator_image_size)
                .attr('height', indicator_image_size)
                .attr('xlink:href', function(d) {
                    return 'data_gen/data/' + d.id + '/integrated_gradients/interpolated_image_1.00.png';
                })
                .attr('id', function(d) { return d.id; })
                .attr('x', function(d) { return d.x; })
                .attr('y', function(d) { return d.y; })
                .attr('opacity', function(d) { return d.opacity; })
                .on('click', select_new_image);
        }
        
        image_init(image_data);
    }

    d3.csv(base_dir + 'cumulative_sums.csv').then(function(data) { draw_chart(data) });
}
figure4();