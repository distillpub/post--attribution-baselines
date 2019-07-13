String.prototype.capitalize = function() {
    return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

function saturation_figure() {
    var margin = ({
        top: 30,
        right: 120,
        bottom: 30,
        left: 60
    });
    
    var indicator_image_size = 75;
    var indicator_image_padding = 10;
    var indicator_box_top_padding = 25;
    
    var tooltip_image_size = 100;

    var chart_width = 500;
    var chart_height = 300;
    var chart_padding = 80;
    
    var width = chart_width;
    var height = chart_height + indicator_box_top_padding + indicator_image_padding + indicator_image_size + chart_padding;
    
    var base_image_name = 'goldfinch';
    var current_data = null;
    var bar_colors = {
        'goldfinch': 'rgb(233, 205, 73)',
        'rubber_eraser': 'rgb(211, 86, 42)',
        'house_finch': 'rgb(100, 92, 77)',
        'killer_whale': 'rgb(12, 16, 19)'
    }
    var indicator_data = [
        { x: 0, y: 0, id: 'goldfinch', opacity: 1.0},
        { x: indicator_image_size + indicator_image_padding, y: 0, id: 'rubber_eraser', opacity: 0.2 },
        { x: 2 * (indicator_image_size + indicator_image_padding), y: 0, id: 'house_finch', opacity: 0.2 },
        { x: 3 * (indicator_image_size + indicator_image_padding), y: 0, id: 'killer_whale', opacity: 0.2 }
    ]
    
    var container = d3.select('#saturation_div')
                        .append('svg')
                        .attr('width',  '100%')
                        .attr('height', '100%')
                        .style('min-width', `${(width + margin.left + margin.right ) / 2}px`)
                        .style('max-width', `${width + margin.left + margin.right}px`)
                        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);
    
    var indicator_group = container
        .append('g')
        .attr('id', 'indicator_group')
        .attr('width', 4 * indicator_image_size + 3 * indicator_image_padding)
        .attr('height', indicator_image_size + indicator_image_padding)
        .attr('transform', `translate(${margin.left}, ${margin.top + chart_height + indicator_box_top_padding + chart_padding})`);
    indicator_group
        .append('text')
        .attr('x', indicator_group.attr('width') / 2)
        .attr('y', -indicator_box_top_padding / 2)
        .attr('text-anchor', 'middle')
        .style('font-weight', 700)
        .style('font-size', '18px')
        .text('Click to select a different image:')
            
    var chart_group = container
        .append('g')
        .attr('id', 'chart_group')
        .attr('width', chart_width)
        .attr('height', chart_height)
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    chart_group.append('text')
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - chart_padding / 2 - 10)
        .attr("x", 0 - chart_height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Softmax Output Probability");
        
    chart_group.append("text")             
      .attr("transform", `translate(${(chart_width / 2)}, ${(chart_height + chart_padding / 2)})`)
      .style("text-anchor", "middle")
      .text("Interpolation Constant (alpha)");

    chart_group.append("text")
      .attr('id', 'chart_title')
      .attr("transform", `translate(${(chart_width) / 2}, -10)`)
      .style("text-anchor", "middle")
      .style("font-weight", 700)
      .text("Softmax Output for Class: " + base_image_name.replace(/_/g, ' ').capitalize());
    
    container.selectAll('text').style("font-family", "sans-serif");
    
    function draw_chart(data, should_init) {
        current_data = data;
        var x = d3.scaleLinear()
            .range([0, chart_width])
            .domain([0.0, 1.0]);
            
        var y = d3.scaleLinear()
            .range([chart_height, 0])
            .domain([0.0, 1.0]);
        
        var line = d3.line()
            .x(function(d) { return x(+d.alpha) })
            .y(function(d) { return y(+d[[base_image_name]])})
            .curve(d3.curveMonotoneX);
        
        if (should_init) {
            var xaxis = chart_group.append('g')
                .attr('class', 'axis axis--x')
                .attr('transform', `translate(0, ${chart_height})`)
                .attr('id', 'chart-x-axis')
                .call(d3.axisBottom(x));
            
            var yaxis = chart_group.append('g')
                .attr('class', 'axis axis--y')
                .attr('id', 'chart-y-axis')
                .call(d3.axisLeft(y));
            
            chart_group.append('g')
                .attr('id', 'grid_markings_horz')    
                .selectAll('line.horizontalGrid').data(y.ticks()).enter()
                .append('line')
                .attr('class', 'horizontalGrid')
                .attr('x1', 0)
                .attr('x2', chart_width)
                .attr('y1', function(d) { return y(d) + 0.5; })
                .attr('y2', function(d) { return y(d) + 0.5; })
                .attr('shape-rendering', 'crispEdges')
                .attr('fill', 'none')
                .attr('stroke', 'gray')
                .attr('stroke-width', '1px')
                .attr('stroke-opacity', 0.3);
                
            chart_group.append('g')
                .attr('id', 'grid_markings_vert')    
                .selectAll('line.verticalGrid').data(y.ticks()).enter()
                .append('line')
                .attr('class', 'verticalGrid')
                .attr('x1', function(d) { return x(d) + 0.5; })
                .attr('x2', function(d) { return x(d) + 0.5; })
                .attr('y1', 0)
                .attr('y2', chart_height)
                .attr('shape-rendering', 'crispEdges')
                .attr('fill', 'none')
                .attr('stroke', 'gray')
                .attr('stroke-width', '1px')
                .attr('stroke-opacity', 0.3);
                
            var path = chart_group.append('path')
                .datum(current_data)
                .attr('id', 'line_mark')
                .attr('class', 'line')
                .attr('d', line)
                .attr('fill', 'none')
                .attr('stroke', bar_colors[[base_image_name]])
                .attr('stroke-width', 4);
            
            var focus = chart_group.append("g")
                .style("display", "none");

            var focus_circle = focus.append("circle")
              .attr("r", 5);
        
            var w = tooltip_image_size - 10;
            var h = tooltip_image_size - 10;
            focus.append('path')
                .attr("fill", "white")
                .attr("stroke", "black")
                .attr('transform', `translate(0, 10)`)
                .attr("d", `M${-w / 2 - 10},5H-5l5,-5l5,5H${w / 2 + 10}v${h + 20}h-${w + 20}z`);
                  
            var focus_image = focus.append('image')
                .attr("width", tooltip_image_size)
                .attr("height", tooltip_image_size)
                .attr("x", -tooltip_image_size / 2)
                .attr("y", 20);

            chart_group.append("rect")
              .attr("fill", "none")
              .attr("pointer-events", "all")
              .attr("width", chart_width)
              .attr("height", chart_height)
              .on("mouseover", function() { focus.style("display", null); })
              .on("mouseout", function() { focus.style("display", "none"); })
              .on("mousemove", mousemove);
              
            var bisectAlpha = d3.bisector(function(d) { return d.alpha; }).left;
            
            function mousemove() {
              var x0 = x.invert(d3.mouse(this)[0]);
              
              var i = bisectAlpha(current_data, x0, 1);
              var d0 = current_data[i - 1];
              var d1 = current_data[i];
              var d = x0 - d0.alpha > d1.alpha - x0 ? d1 : d0;
              
              var alpha_val = Number((Math.floor(+d.alpha * 50) / 50).toFixed(2));
              var base_dir = `data_gen/data/${base_image_name}/integrated_gradients/`;
              var interp_im_file = 'interpolated_image_';
              var interp_file = base_dir + interp_im_file + alpha_val.toFixed(2) + '.png';
              
              focus_circle.attr('fill', bar_colors[[base_image_name]]);
              focus.attr("transform", "translate(" + x(d.alpha) + "," + y(d[[base_image_name]]) + ")");
              focus_image.attr('xlink:href', interp_file);
            }
        }
        else {
            var transition_duration = 500;
            var mark_transition = d3
                .transition()
                .duration(transition_duration);
            chart_group.select('#line_mark')
                .datum(current_data)
                .transition(mark_transition)
                .attr('d', line)
                .attr('stroke', bar_colors[[base_image_name]])
        }
    }
    
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
        chart_group.select('#chart_title')
            .text("Softmax Output for Class: " + base_image_name.replace(/_/g, ' ').capitalize());
        draw_chart(current_data, false);
    }
    
    var indicator_images = indicator_group.selectAll('image').data(indicator_data);
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
    
    d3.csv('data_gen/data/output_alpha.csv').then(function(data) { draw_chart(data, true) });
}
saturation_figure();