String.prototype.capitalize = function() {
    return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

function figure_ablation() {
    var margin = ({
        top: 30,
        right: 160,
        bottom: 30,
        left: 60
    });

    var tooltip_image_size = 100;

    var chart_width   = 500;
    var chart_height  = 300;
    var chart_padding = 80;
    var legend_top_padding = 165;
    var legend_left_padding = 10;
    var legend_width  = 160;
    var legend_height = 126;
    
    var ablated_image_size = 90;
    var ablated_image_top_padding = 25;
    var ablated_image_inter_padding = 10.5;
    var x_axis_label_top_padding = 20;
    
    var button_left_padding = 20;
    var button_group_top_padding = 50;
    var button_inter_padding = 15;
    var button_width = 100;
    var button_height = 40;
    var num_buttons = 4;
    
    var width = chart_width;
    var height = chart_height + ablated_image_top_padding + 
        x_axis_label_top_padding + ablated_image_size;
    
    var current_ablation_type = 'blur';
    var current_data = null;
    
    var legend_data = [
        { 'baseline': 'eg',         'name': 'Expected Gradients',   'x': 30, 'y': 20 },
        { 'baseline': 'gaussian',   'name': 'Gaussian Baseline',    'x': 30, 'y': 36 },
        { 'baseline': 'ig',         'name': 'Black Baseline',       'x': 30, 'y': 52 },
        { 'baseline': 'max_dist',   'name': 'Max Dist. Baseline',   'x': 30, 'y': 68 },
        { 'baseline': 'uniform',    'name': 'Uniform Baseline',     'x': 30, 'y': 84 },
        { 'baseline': 'blur',       'name': 'Blurred Baseline',     'x': 30, 'y': 100 },
        { 'baseline': 'null_gaussian',       'name': 'Random Noise',     'x': 30, 'y': 116 }
    ];
    
    var ablation_type_data = [
        { 'ablation_type': 'blur',  'name': 'Blur Top K',          
            'x': 0, 'y': 0 },
        { 'ablation_type': 'mean',  'name': 'Mean Top K',   
            'x': 0, 'y': button_height + button_inter_padding },
        { 'ablation_type': 'blur_center',  'name': 'Blur Center',         
            'x': 0, 'y': 2 * (button_height + button_inter_padding) },
        { 'ablation_type': 'mean_center',  'name': 'Mean Center',  
            'x': 0, 'y': 3 * (button_height + button_inter_padding) },
    ]
    
    var ablated_image_data = [
        { 'k': 0.0, 'x': 0, 'y': 0 },
        { 'k': 0.2, 'x': ablated_image_size + ablated_image_inter_padding, 'y': 0 },
        { 'k': 0.4, 'x': 2 * (ablated_image_size + ablated_image_inter_padding), 'y': 0 },
        { 'k': 0.6, 'x': 3 * (ablated_image_size + ablated_image_inter_padding), 'y': 0 },
        { 'k': 0.8, 'x': 4 * (ablated_image_size + ablated_image_inter_padding), 'y': 0 },
        { 'k': 1.0, 'x': 5 * (ablated_image_size + ablated_image_inter_padding), 'y': 0 }
    ]
    
    var container = d3.select('#figure_ablation_div')
                        .append('svg')
                        .attr('width',  '100%')
                        .attr('height', '100%')
                        .style('min-width', `${(width + margin.left + margin.right ) / 2}px`)
                        .style('max-width', `${width + margin.left + margin.right}px`)
                        .attr('viewBox', `0 0 
                            ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);

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
        .text("1.0 - (Logit of True Class)");
        
    chart_group.append("text")             
        .attr("transform", `translate(${(chart_width / 2)}, 
            ${(chart_height + x_axis_label_top_padding
               + ablated_image_size + ablated_image_top_padding)})`)
        .style("text-anchor", "middle")
        .text("Fraction of Image Ablated");

    chart_group.append("text")
        .attr('id', 'chart_title')
        .attr("transform", `translate(${(chart_width) / 2}, -10)`)
        .style("text-anchor", "middle")
        .style("font-weight", 700)
        .text("Decrease in Class Logit as a Function of Ablation");
        
    function create_ablated_images() {
        var ablated_image_group = chart_group.append('g')
            .attr('id', 'ablated_image_group')
            .attr('transform', `translate(${-ablated_image_size / 2}, 
                ${chart_height + ablated_image_top_padding})`);
        
        ablated_image_group.selectAll('image')
            .data(ablated_image_data)
            .enter()
            .append('image')
            .attr('width', ablated_image_size)
            .attr('height', ablated_image_size)
            .attr('xlink:href', function(d) {
                return `../data_gen/data/goldfinch/ablation/${current_ablation_type}_${(d.k).toFixed(2)}.png`;
            })
            .attr('id', function(d) { return 'ablated_image_' + Math.round(10 * d.k) ; })
            .attr('x', function(d)  { return d.x; })
            .attr('y', function(d)  { return d.y; });
    }
    
    function update_ablated_images() {
        var ablated_image_group = chart_group.select('#ablated_image_group');
        ablated_image_data.forEach(function(item) {
            var ablated_image = ablated_image_group.select('#ablated_image_' + Math.round(10 * item.k));
            var ablated_file  = 
                `../data_gen/data/goldfinch/ablation/${current_ablation_type}_${(item.k).toFixed(2)}.png`;
            
            cross_fade_image(ablated_image, ablated_file, ablated_image_group, 500);
        });
    }
        
    function create_type_buttons() {
        var button_group = chart_group.append('g')
            .attr('id', 'button_group')
            .attr('transform', `translate(${chart_width + button_left_padding}, ${button_group_top_padding})`);
        
        // var button_indicator_rect = button_group
        //     .append('rect')
        //     .attr('width', button_width)
        //     .attr('height', button_height * num_buttons + button_inter_padding * (num_buttons - 1))
        //     .style('fill', 'red')
        //     .style('stroke', 'gray');
            
        function handle_mouseover(d, i) {
            if (current_ablation_type == d.ablation_type) {
                return;
            }
            
            button_group
                .select(`#${d.ablation_type}_button_rect`)
                .attr('opacity', 0.6);
            
            button_group
                .select(`#${d.ablation_type}_button_text`)
                .attr('opacity', 0.6);
        }
        
        function handle_mouseout(d, i) {
            if (current_ablation_type == d.ablation_type) {
                return;
            }
            
            button_group
                .select(`#${d.ablation_type}_button_rect`)
                .attr('opacity', 0.2);
            
            button_group
                .select(`#${d.ablation_type}_button_text`)
                .attr('opacity', 0.2);
        }
        function handle_mousedown(d, i) {
            if (current_ablation_type == d.ablation_type) {
                return;
            }
            
            var previous_ablation_type = current_ablation_type;
            current_ablation_type = d.ablation_type;
            
            handle_mouseout({ 'ablation_type': previous_ablation_type }, 0)
            
            button_group
                .select(`#${d.ablation_type}_button_rect`)
                .attr('opacity', 1.0);
            
            button_group
                .select(`#${d.ablation_type}_button_text`)
                .attr('opacity', 1.0);
                
            d3.csv(`../data_gen/data/ablation_data/${current_ablation_type}/final.csv`).then(function(data) { 
                update_ablated_images();
                draw_chart(data, false);
            });
        }
        
        button_group.selectAll('rect')
            .data(ablation_type_data)
            .enter()
            .append('rect')
            .attr('id', function(d) {
                return d.ablation_type + '_button_rect';
            })
            .attr('x', function(d) { return d.x; })
            .attr('y', function(d) { return d.y; })
            .style('fill', 'white')
            .style('stroke', 'gray')
            .attr('width',  button_width)
            .attr('height', button_height)
            .attr('opacity', function(d) {
                if (d.ablation_type == current_ablation_type) {
                    return 1.0;
                } else {
                    return 0.2;
                }
            })
            .on('mouseover', handle_mouseover)
            .on('mouseout',  handle_mouseout)
            .on('mousedown', handle_mousedown);
            
        button_group.selectAll('text')
            .data(ablation_type_data)
            .enter()
            .append('text')
            .attr('font-size', '14px')
            .attr('id', function(d) {
                return d.ablation_type + '_button_text';
            })
            .style("text-anchor", "middle")
            .attr('opacity', function(d) {
                if (d.ablation_type == current_ablation_type) {
                    return 1.0;
                } else {
                    return 0.2;
                }
            })
            .attr('x', function(d) { return d.x + button_width / 2; })
            .attr('y', function(d) { return d.y + button_height / 2 + 5; })
            .text(function(d) { 
                return d.name;
            })
            .style('user-select', 'none')
            .on('mouseover', handle_mouseover)
            .on('mouseout',  handle_mouseout)
            .on('mousedown', handle_mousedown);
            
        button_group.append('text')
            .attr('x', 105)
            .attr('y', -button_width - 10)
            .attr('font-size', '16px')
            .style("text-anchor", "middle")
            .text('Click to select an ablation type')
            .attr('transform', 'rotate(90)');
    }
    
    function draw_legend() {
        var legend_group = chart_group.append('g')
            .attr('id', 'chart_legend')
            .attr('transform', `translate(${chart_width - legend_width - legend_left_padding}, 
                ${legend_top_padding})`);
        
        legend_group
            .append('rect')
            .attr('width', legend_width)
            .attr('height', legend_height)
            .style('fill', 'white')
            .style('stroke', 'gray');
        
        var text_group = legend_group
            .append('g')
            .attr('id', 'legend_text');
            
        var rect_group = legend_group.append('g')
            .attr('id', 'rect_group');
            
        function handle_mouseover(d, i) {
            legend_data.forEach(function(item) {
                var opacity = 0.2;
                var stroke_width = 2;
                if (item.baseline == d.baseline) {
                    opacity = 1.0;
                    stroke_width = 4;
                }
                
                text_group
                    .select(`#${item.baseline}_legend_title`)
                    .attr('opacity', opacity);
                
                rect_group
                    .select(`#${item.baseline}_legend_rect`)
                    .attr('opacity', opacity);
                    
                chart_group.select('#line_group')
                    .select(`#${item.baseline}_line`)
                    .attr('opacity', function(d) {
                        return opacity;
                    })
                    .attr('stroke-width', stroke_width);
            })
        }
        
        function handle_mouseout(d, i) {
            legend_data.forEach(function(item) {
                var opacity = 1.0;
                var stroke_width = 2;
                
                text_group
                    .select(`#${item.baseline}_legend_title`)
                    .attr('opacity', opacity);
                
                rect_group
                    .select(`#${item.baseline}_legend_rect`)
                    .attr('opacity', opacity);
                
                chart_group.select('#line_group')
                    .select(`#${item.baseline}_line`)
                    .attr('opacity', function(d) {
                        return opacity;
                    })
                    .attr('stroke-width', stroke_width);
            })
        }
                
        text_group.selectAll('text')
            .data(legend_data)
            .enter()
            .append('text')
            .attr('id', function(d) { 
                return d.baseline + '_legend_title';
            })
            .attr('font-size', '14px')
            .text(function(d) {
                return d.name;
            })
            .attr('x', function(d) { return d.x; })
            .attr('y', function(d) { return d.y; })
            .on('mouseover', handle_mouseover)
            .on('mouseout',  handle_mouseout);
            
        var color_domain = (current_data.map((d) => { return d.baseline })).filter(onlyUnique);
        var color = d3.scaleOrdinal().range(d3.schemeCategory10).domain(color_domain);
        
        var rect_width = 13;
        var rect_height = 5;
        
        rect_group
            .selectAll('rect')
            .data(legend_data)
            .enter()
            .append('rect')
            .attr('id', function(d) {
                return d.baseline + '_legend_rect';
            })
            .attr('x', function(d) { return d.x - rect_width - 7; })
            .attr('y', function(d) { return d.y - rect_height - 2; })
            .style('fill', function(d) {
                return color(d.baseline);
            })
            .attr('width',  rect_width)
            .attr('height', rect_height)
            .on('mouseover', handle_mouseover)
            .on('mouseout',  handle_mouseout);
    }
    
    function draw_chart(data, should_init) {
        current_data = data;
        var x = d3.scaleLinear()
            .range([0, chart_width])
            .domain([0.0, 1.0]);
            
        var y = d3.scaleLinear()
            .range([chart_height, 0])
            .domain([0.0, 1.0]);
        
        var color_domain = (current_data.map((d) => { return d.baseline })).filter(onlyUnique);
        var color = d3.scaleOrdinal().range(d3.schemeCategory10).domain(color_domain);
        
        var line_data = color.domain().map(function(baseline) {
            return {
                baseline: baseline,
                values: current_data.filter(function(d) {
                    return d.baseline == baseline;
                }).map(function(d) {
                    return { k: +d.k,
                        mean_logit_fraction: +d.mean_logit_fraction };
                })
            }
        })
        
        var line = d3.line()
            .x(function(d) { return x(+d.k) })
            .y(function(d) { return y(1.0 - +d.mean_logit_fraction)})
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
            
            chart_group
                .append('g')
                .attr('id', 'line_group')
                .selectAll('.line')
                .data(line_data)
                .enter()
                .append('path')
                .attr('id', function(d) { return d.baseline + '_line'})
                .attr('class', 'line')
                .attr("d", function(d) { return line(d.values); })
                .attr("stroke", function(d) { return color(d.baseline); })
                .attr('stroke-width', 2)
                .attr('fill', 'none');
        }
        else {
            var transition_duration = 500;
            var mark_transition = d3
                .transition()
                .duration(transition_duration);
            
            chart_group.select('#line_group')
                .selectAll('.line')
                .data(line_data)
                .transition(mark_transition)
                .attr("d", function(d) { return line(d.values); });
        }
    }
    
    d3.csv(`../data_gen/data/ablation_data/${current_ablation_type}/final.csv`).then(function(data) { 
        draw_chart(data, true);
        draw_legend();
        create_type_buttons();
        create_ablated_images();
        container.selectAll('text').style("font-family", "sans-serif");
    });
}
figure_ablation();