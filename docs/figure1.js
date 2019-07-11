function figure1() {
    var margin = ({
        top: 30,
        right: 30,
        bottom: 30,
        left: 30
    });

    var image_size = 300;
    var chart_width = 300;
    var chart_height = 300;
    var chart_image_padding = 150;
    var chart_axis_padding = 50;
    var chart_bottom_label_padding = 60;

    var indicator_image_size = 75;
    var indicator_image_padding = 10;
    var indicator_box_top_padding = 50;

    var width = image_size + chart_image_padding + chart_width;
    var height = image_size + indicator_image_size + indicator_image_padding + indicator_box_top_padding;

    var base_image_name = 'goldfinch';
    var base_dir = `data_gen/data/${base_image_name}/`;
    var current_data = null;

    var transition_duration  = 500;

    var indicator_data = [
        { x: 0, y: 0, id: 'goldfinch', opacity: 1.0},
        { x: indicator_image_size + indicator_image_padding, y: 0, id: 'rubber_eraser', opacity: 0.2 },
        { x: 2 * (indicator_image_size + indicator_image_padding), y: 0, id: 'house_finch', opacity: 0.2 },
        { x: 3 * (indicator_image_size + indicator_image_padding), y: 0, id: 'killer_whale', opacity: 0.2 }
    ]
    var bar_colors = {
        'goldfinch': 'rgb(233, 205, 73)',
        'rubber_eraser': 'rgb(211, 86, 42)',
        'house_finch': 'rgb(100, 92, 77)',
        'killer_whale': 'rgb(12, 16, 19)'
    }

    var container = d3.select('#figure1_div')
        .append('svg')
        .attr('width',  '100%')
        .attr('height', '100%')
        .style('min-width', `${(width + margin.left + margin.right ) / 2}px`)
        .style('max-width', `${width + margin.left + margin.right}px`)
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);
          
    var image_group = container
        .append('g')
        .attr('id', 'image_group_fig1')
        .attr('width', width)
        .attr('height', image_size)
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
        
    var indicator_group = container
        .append('g')
        .attr('id', 'indicator_group_fig1')
        .attr('width', 4 * indicator_image_size + 3 * indicator_image_padding)
        .attr('height', indicator_image_size + indicator_image_padding)
        .attr('transform', `translate(${margin.left}, ${margin.top + image_size + indicator_image_padding + indicator_box_top_padding})`);

    indicator_group
        .append('text')
        .attr('x', indicator_group.attr('width') / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .style('font-weight', 700)
        .text('Click to select a different image:')
        .style('font-size', '18px')
        .style("font-family", "sans-serif");

    var base_image_name = 'goldfinch';
    var base_link = 'data_gen/data/' + base_image_name + '/';

    var display_image = image_group.append('svg:image')
        .attr('id', 'display_image_fig1')
        .attr('width', image_size)
        .attr('height', image_size)
        .attr('xlink:href', base_link + 'integrated_gradients/interpolated_image_1.0.png')
        .attr('x', 0)
        .attr('y', 0);

    var display_text = image_group.append('text')
        .attr('id', 'display_text_fig1')
        .attr('font-weight', 700)
        .text('True Label: goldfinch')
        .attr('text-anchor', 'middle')
        .attr('x', image_size / 2)
        .attr('y', -10)
        .style('font-size', '20px')
        .style('font-family', 'sans-serif');

    var bar_chart = image_group.append('g')
        .attr('id', 'bar_chart_fig1')
        .attr('width', chart_width)
        .attr('height', chart_height)
        .attr('transform', `translate(${image_size + chart_image_padding}, 0)`);

    bar_chart.append('text')
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - chart_axis_padding - 10)
        .attr("x", 0 - chart_height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Log-Scaled Softmax Logits");

    bar_chart.append("text")        
        .attr("transform", `translate(${(chart_width / 2)}, ${(chart_height + chart_axis_padding + chart_bottom_label_padding)})`)
        .style("text-anchor", "middle")
        .text("Top 5 Predicted Output Classes");
        
    bar_chart.append('text')
        .attr('transform', `translate(${chart_width / 2}, -10)`)
        .attr('text-anchor', 'middle')
        .attr('font-weight', 700)
        .style('font-size', '18px')
        .text('Softmax Output for the Top 5 Classes')
        
    container.selectAll('text').style("font-family", "sans-serif");

    function draw_chart(data, is_updating) {
        current_data = data;
        
        var class_domain = d3.set(current_data.map(function (d) {
            return d.pred_name.replace(/_/g, ' ');
        })).values();
        
        var probability_domain = [0.0001, 1.0];
        
        var x = d3.scaleBand()
            .rangeRound([0, chart_width])
            .padding(0.1)
            .domain(class_domain);
        
        var y = d3.scaleLog()
            .range([chart_height, 0])
            .domain(probability_domain);
            
        if (!is_updating) {
            var xaxis = bar_chart.append('g') 
                .attr('class', 'axis axis--x')
                .attr('transform', `translate(0, ${chart_height})`)
                .attr('id', 'chart-x-axis_fig1')
                .call(d3.axisBottom(x));
            
            var yaxis = bar_chart.append('g')
                .attr('class', 'axis axis--y')
                .attr('id', 'chart-y-axis_fig1')
                .call(d3.axisLeft(y));

            bar_chart.append('g')
                .attr('id', 'grid_markings_fig1')
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
                .attr('stroke-opacity', 0.3)
                .attr('stroke-width', '1px');
            
            xaxis.selectAll('text')
                .style('font-size', '14px')
                .attr('transform', 'rotate(315)')
                .attr('text-anchor', 'end');
        }
        else {
            var xaxis = bar_chart.select('#chart-x-axis_fig1');
            var yaxis = bar_chart.select('#chart-y-axis_fig1');
            
            xaxis.call(d3.axisBottom(x));
            yaxis.call(d3.axisLeft(y));
            
            xaxis.selectAll('text')
                .style('font-size', '14px')
                .attr('transform', 'rotate(315)')
                .attr('text-anchor', 'end');
        }
        
        var bars = bar_chart
            .selectAll('rect')
            .data(current_data);
        
        if (!is_updating)
        {
            bars.enter()
                .append('rect')
                .attr('fill', bar_colors[base_image_name])
                .attr('stroke', 'none')
                .attr('x', function(d) { return x(d.pred_name.replace(/_/g, ' ')); })
                .attr('y', function(d) { return y(+d.pred_logit); })
                .attr('width', x.bandwidth())
                .attr('height', function(d) { return chart_height - y(+d.pred_logit); });
        }
        else {
            bars.transition()
                .duration(transition_duration)
                .attr('x', function(d) { return x(d.pred_name.replace(/_/g, ' ')); })
                .attr('y', function(d) { return y(+d.pred_logit); })
                .attr('width', x.bandwidth())
                .attr('height', function(d) { return chart_height - y(+d.pred_logit); })
                .attr('fill', bar_colors[base_image_name]);
        }
    }

    function select_new_image(row, i) {
        if (base_image_name === row.id) {
            return;
        }
        var indicator_images = indicator_group.selectAll('image').data(indicator_data);
        indicator_images.attr('opacity', function(d) {
            if (row.id == d.id) {
                return 1.0;
            } else {
                return 0.2;
            }
        })
        
        base_image_name = row.id;
        base_dir = `data_gen/data/${base_image_name}/`;
        
        cross_fade_image(display_image, 
                         base_dir + 'integrated_gradients/interpolated_image_1.0.png',
                         image_group,
                         transition_duration);
                         
        var formatted_name = base_image_name.replace(/_/g, ' ');
        display_text
            .text('True Label: ' + formatted_name);
        
        d3.csv(base_dir + 'logit_data.csv').then(function(z) { 
            draw_chart(z, true);
        });
    }

    var indicator_images = indicator_group.selectAll('image').data(indicator_data);
    indicator_images.enter()
        .append('image')
        .attr('width', indicator_image_size)
        .attr('height', indicator_image_size)
        .attr('xlink:href', function(d) {
            return 'data_gen/data/' + d.id + '/integrated_gradients/interpolated_image_1.0.png';
        })
        .attr('id', function(d) { return d.id + '_fig1'; })
        .attr('x', function(d) { return d.x; })
        .attr('y', function(d) { return d.y; })
        .attr('opacity', function(d) { return d.opacity; })
        .on('click', select_new_image);

    d3.csv(base_dir + 'logit_data.csv').then(function(data) { draw_chart(data, false) });
}
figure1();
