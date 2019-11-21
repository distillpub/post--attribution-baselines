function figure_multi_ref() {
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
    
    var slider_group_width  = 500;
    var slider_group_height = 100;
    var slider_group_left_padding = 100;
    var slider_group_top_padding  = 50;
    var slider_group_internal_width_padding = 25;
    
    var button_left_padding = 60;
    var button_group_top_padding = 215;
    var button_inter_padding = 15;
    var button_width = 150;
    var button_height = 50;
    var num_buttons = 2;

    var num_baseline_choices = 4;
    var baseline_choice_size = 75;
    var baseline_choice_padding = 10;
    var image_padding  = 10;
    var baseline_right_padding = 20;
    var text_top_padding = 20
    var text_width = 100;
    var baseline_choice_width  = baseline_choice_size + image_padding + text_width + baseline_right_padding;
    var baseline_choice_height = num_baseline_choices * baseline_choice_size +
                                 (num_baseline_choices - 1) * baseline_choice_padding +
                                 text_top_padding;
                                 
    var num_images = 3;
    var width = num_images * image_size + (num_images - 1) * image_padding + baseline_choice_width;
    var height = image_size + indicator_image_size + indicator_image_padding + indicator_box_top_padding;

    var base_image_name = 'goldfinch';
    var current_sigma = 0.5;
    var current_baseline_name = 'gaussian';
    var current_baseline_id   = '#baseline_gaussian' + Math.round(current_sigma * 2);
    var current_attribution_id = '#attributions_gaussian' + Math.round(current_sigma * 2);
    var base_dir = `data_gen/data/${base_image_name}/`;

    var gaussian_sigmas = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
    var display_multi_reference = false;
    var display_smooth_grad = false;

    var image_data = [];
    for (i in gaussian_sigmas) {
        sigma = gaussian_sigmas[i];
        image_data.push({
            x: 2 * (image_size + image_padding), y: 0, id: 'attributions_gaussian', sigma: sigma
        });
        for (var j = 1; j <= 3; ++j) {
            image_data.push({
                x: 0, y: 0, id: 'baseline_gaussian', sigma: sigma, set: j
            });
        }
    }
    image_data.push({
        x: image_size + image_padding, y: 0, id: 'orig_image_gaussian', sigma: null
    });
    
    var title_data = [
        { x: 0, y: 0, id: 'baseline_gaussian', title: 'Baseline Image'},
        { x: image_size + image_padding, y: 0, id: 'orig_image_gaussian', title: 'Original Image'},
        { x: 2 * (image_size + image_padding), y: 0, id: 'attributions_gaussian', title: 'Pixel Attributions'}
    ];

    var indicator_data = [
        { x: 0, y: 0, id: 'goldfinch', opacity: 1.0},
        { x: 1 * (indicator_image_size + indicator_image_padding), y: 0, id: 'rubber_eraser', opacity: 0.2 },
        { x: 2 * (indicator_image_size + indicator_image_padding), y: 0, id: 'house_finch', opacity: 0.2 },
        { x: 3 * (indicator_image_size + indicator_image_padding), y: 0, id: 'killer_whale', opacity: 0.2 }
    ];
    
    var baseline_data = [
        { x: text_width, y: 0 * (indicator_image_size + indicator_image_padding), id: 'uniform',  opacity: 0.2 },
        { x: text_width, y: 1 * (indicator_image_size + indicator_image_padding), id: 'gaussian', opacity: 1.0 }
    ];
    
    var button_data = [
        { 'id': 'mult_ref_button',  'name': 'Multi-Reference',          
            'x': 0, 'y': 0 },
        { 'id': 'sg_button',  'name': 'Smooth Grad',   
            'x': 0, 'y': button_height + button_inter_padding }
    ];

    var container = d3.select('#figure_multi_ref_div')
                        .append('svg')
                        .attr('width',  '100%')
                        .attr('height', '100%')
                        .style('min-width', `${(width + margin.left + margin.right ) / 2}px`)
                        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);

    var image_group = container
        .append('g')
        .attr('id', 'image_group_gaussian')
        .attr('width', width)
        .attr('height', image_size)
        .attr('transform', `translate(${margin.left + baseline_choice_width}, ${margin.top})`);
    
    image_group
        .selectAll('text')
        .data(title_data)
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
        
    var baseline_group  = container
        .append('g')
        .attr('id',    'baseline_group')
        .attr('width',  baseline_choice_width)
        .attr('height', baseline_choice_height)
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    baseline_group.selectAll('text')
        .data(baseline_data)
        .enter()
        .append('text')
        .attr('id', function(d) { 
            return d.id + '_baseline_title'; 
        })
        .style("text-anchor", "end")
        .style("font-weight", 100)
        .style('font-size', '18px')
        .text(function(d) { 
            if (d.id == 'max_dist') {
                return 'max dist.';
            } else {
                return d.id;
            }
        })
        .attr('opacity', function(d) { return d.opacity; })
        .attr('x', text_width - 10)
        .attr('y', function(d) { return d.y + 
            baseline_choice_size / 2 + 5; 
        })
        .on('click', select_new_baseline);
    
    baseline_group
        .append('text')
        .attr('x', -baseline_choice_height / 2)
        .attr('y', 0)
        .style("text-anchor", "middle")
        .style('font-weight', 700)
        .style('font-size', '18px')
        .text('Click to select a different baseline:')
        .attr('transform', `rotate(-90)`);

    var indicator_group = container
        .append('g')
        .attr('id', 'indicator_group_gaussian')
        .attr('width', 4 * indicator_image_size + 3 * indicator_image_padding)
        .attr('height', indicator_image_size + indicator_image_padding + image_padding)
        .attr('transform', `translate(${margin.left + baseline_choice_width}, ${margin.top + image_size + 
            image_padding + indicator_box_top_padding})`);

    indicator_group
        .append('text')
        .attr('x', indicator_group.attr('width') / 2)
        .attr('y', -indicator_box_top_padding / 2)
        .attr('text-anchor', 'middle')
        .style('font-weight', 700)
        .style('font-size', '18px')
        .text('Click to select a different image:');
        
    function turn_on_smoothgrad() {
        display_smooth_grad = true;
        gaussian_sigmas.forEach(function(sigma) {
            var saliency_id = '#attributions_gaussian' + Math.round(sigma * 2);
            var saliency_image = image_group.select(saliency_id);
            var saliency_file = base_dir + `baselines/gaussian/saliency_sg_sigma${sigma.toFixed(1)}.png`;
            
            saliency_image.attr('xlink:href', saliency_file);
        });
    }
    
    function turn_off_smoothgrad(switch_main) {
        display_smooth_grad = false;
        gaussian_sigmas.forEach(function(sigma) {
            if (!switch_main && sigma == current_sigma) {
                return;
            }
            var saliency_id = '#attributions_gaussian' + Math.round(sigma * 2);
            var saliency_image = image_group.select(saliency_id);
            
            var saliency_file = base_dir + `baselines/gaussian/saliency_sigma${sigma.toFixed(1)}.png`;
            if (display_multi_reference) {
                saliency_file = base_dir + `baselines/gaussian/saliency_eg_sigma${sigma.toFixed(1)}.png`;
            }
            
            saliency_image.attr('xlink:href', saliency_file);
        });
    }

    function toggle_multi_reference() {
        var sub_image_size = Math.round(image_size / 3);
        
        if (display_multi_reference) {
            display_multi_reference = false;
            turn_off_smoothgrad(true);
            
            image_group.select('#baseline_gaussian_title')
                .text('Baseline Image');
            container
                .select('#button_group_gaussian')
                .select('#sg_button_rect')
                .attr('opacity', 0.0);
            container
                .select('#button_group_gaussian')
                .select('#sg_button_text')
                .attr('opacity', 0.0);
            
            gaussian_sigmas.forEach(function(sigma) {
                var saliency_id = '#attributions_gaussian' + Math.round(sigma * 2)
                var saliency_image = image_group.select(saliency_id);
                
                if (current_baseline_name == 'uniform' && sigma == 0.5) {
                    saliency_image
                        .attr('xlink:href', 
                            base_dir + `baselines/uniform/saliency.png`);
                } else {
                    saliency_image
                        .attr('xlink:href', 
                            base_dir + `baselines/gaussian/saliency_sigma${sigma.toFixed(1)}.png`);
                }
                
                
                for (var j = 1; j <= 3; ++j) {
                    var set_x = 0;
                    var set_y = 0;
                    var set_opacity = 0.0;
                    if (j == 1 && sigma == current_sigma) {
                        set_opacity = 1.0;
                    }
                    
                    var baseline_id = '#baseline_gaussian' + Math.round(sigma * 2) + j.toString();
                    var baseline_image = image_group.select(baseline_id);
                    
                    baseline_image
                        .attr('opacity', set_opacity)
                        .attr('x', set_x)
                        .attr('y', set_y)
                        .attr('width',  image_size)
                        .attr('height', image_size);
                }
            });
        } else {
            display_multi_reference = true;
            image_group.select('#baseline_gaussian_title')
                .text('Baseline Images');
            
            if (current_baseline_name == 'gaussian') {
                container
                    .select('#button_group_gaussian')
                    .select('#sg_button_rect')
                    .attr('opacity', 0.2);
                container
                    .select('#button_group_gaussian')
                    .select('#sg_button_text')
                    .attr('opacity', 0.2);
            }
                
            gaussian_sigmas.forEach(function(sigma) {
                var saliency_id = '#attributions_gaussian' + Math.round(sigma * 2)
                var saliency_image = image_group.select(saliency_id);
                
                if (current_baseline_name == 'uniform' && sigma == 0.5) {
                    saliency_image
                        .attr('xlink:href', 
                            base_dir + `baselines/uniform/saliency_eg.png`);
                } else {
                    saliency_image
                        .attr('xlink:href', 
                            base_dir + `baselines/gaussian/saliency_eg_sigma${sigma.toFixed(1)}.png`);
                }
                        
                for (var j = 1; j <= 3; ++j) {
                    var opacity = 0.0;
                    if (sigma == current_sigma) {
                        opacity = 1.0;
                    }
                    var set_x = Math.round(image_size / 3);
                    var set_y = Math.round(2 * image_size / 15);
                    if (j == 2) {
                         set_x = Math.round(2 * image_size / 15);
                         set_y = Math.round(8 * image_size / 15);
                    } else if (j == 3) {
                        set_x = Math.round(8 * image_size / 15);
                        set_y = Math.round(8 * image_size / 15);
                    }
                    
                    var baseline_id = '#baseline_gaussian' + Math.round(sigma * 2) + j.toString();
                    var baseline_image = image_group.select(baseline_id);
                    
                    baseline_image
                        .attr('opacity', opacity)
                        .attr('x', set_x)
                        .attr('y', set_y)
                        .attr('width',  sub_image_size)
                        .attr('height', sub_image_size);
                }
            });
        }
    }
    
    function create_toggle_buttons() {
        var button_group = container.append('g')
            .attr('id', 'button_group_gaussian')
            .attr('transform', `translate(${button_left_padding}, ${button_group_top_padding})`);
            
        function handle_mouseover(d, i) {
            if (d.id == 'sg_button' && 
                (!display_multi_reference || 
                current_baseline_name != 'gaussian')) {
                return;
            }
            
            if (button_group
                .select(`#${d.id}_rect`)
                .attr('opacity') == 1.0)
            {
                return;
            }
            
            button_group
                .select(`#${d.id}_rect`)
                .attr('opacity', 0.5);
            
            button_group
                .select(`#${d.id}_text`)
                .attr('opacity', 0.5);
        }
        
        function handle_mouseout(d, i) {
            if (d.id == 'sg_button' && 
                (!display_multi_reference || 
                current_baseline_name != 'gaussian')) {
                return;
            }
            
            if (button_group
                .select(`#${d.id}_rect`)
                .attr('opacity') == 1.0)
            {
                return;
            }
            
            button_group
                .select(`#${d.id}_rect`)
                .attr('opacity', 0.2);
            
            button_group
                .select(`#${d.id}_text`)
                .attr('opacity', 0.2);
        }
        
        function handle_mousedown(d, i) {
            if (d.id == 'sg_button' && 
                (!display_multi_reference || 
                current_baseline_name != 'gaussian')) {
                return;
            }
            
            if (button_group
                .select(`#${d.id}_rect`)
                .attr('opacity') == 1.0)
            {
                button_group
                    .select(`#${d.id}_rect`)
                    .attr('opacity', 0.5);
                
                button_group
                    .select(`#${d.id}_text`)
                    .attr('opacity', 0.5);
            } else {
                button_group
                    .select(`#${d.id}_rect`)
                    .attr('opacity', 1.0);
                
                button_group
                    .select(`#${d.id}_text`)
                    .attr('opacity', 1.0);
            }
            
            if (d.id == 'mult_ref_button') {
                toggle_multi_reference();
            } else if (d.id == 'sg_button') {
                if (display_smooth_grad) {
                    turn_off_smoothgrad(true);
                } else {
                    turn_on_smoothgrad();
                }
            }
        }
        
        button_group.selectAll('rect')
            .data(button_data)
            .enter()
            .append('rect')
            .attr('id', function(d) {
                return d.id + '_rect';
            })
            .attr('x', function(d) { return d.x; })
            .attr('y', function(d) { return d.y; })
            .style('fill', 'white')
            .style('stroke', 'gray')
            .attr('width',  button_width)
            .attr('height', button_height)
            .attr('opacity', function(d) {
                if (d.id == 'mult_ref_button') {
                    return 0.2
                } else {
                    return 0.0;
                }
            })
            .on('mouseover', handle_mouseover)
            .on('mouseout',  handle_mouseout)
            .on('mousedown', handle_mousedown);
            
        button_group.selectAll('text')
            .data(button_data)
            .enter()
            .append('text')
            .attr('font-size', '18px')
            .attr('id', function(d) {
                return d.id + '_text';
            })
            .style("text-anchor", "middle")
            .attr('opacity', function(d) {
                if (d.id == 'mult_ref_button') {
                    return 0.2
                } else {
                    return 0.0;
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
    }
    
    create_toggle_buttons();
    
    function remove_slider() {
        var slider_group = container.select('#slider_group_baselines');
        slider_group.remove();
    }
    
    function update_slider(baseline_name, new_sigma) {
        var select_sigma_new = Math.round(new_sigma);
        
        new_sigma = Math.round(new_sigma) / 2.0;
        var select_sigma_old = Math.round(current_sigma * 2);
        
        if (new_sigma != current_sigma) {
            var max_set = 1;
            if (display_multi_reference) {
                max_set = 3;
            }
            
            for (var j = 1; j <= max_set; ++j) {
                image_group.select('#baseline_gaussian' + select_sigma_old + j.toString())
                    .attr('opacity', 0.0);
                image_group.select('#baseline_gaussian' + select_sigma_new + j.toString())
                    .attr('opacity', 1.0);
            }
                    
            image_group.select('#attributions_gaussian' + select_sigma_old)
                .attr('opacity', 0.0);
            image_group.select('#attributions_gaussian' + select_sigma_new)
                .attr('opacity', 1.0);     
        }
             
        current_sigma = new_sigma;
        
        current_baseline_id    = '#baseline_gaussian'     + select_sigma_new;
        current_attribution_id = '#attributions_gaussian' + select_sigma_new;
    }
    
    function create_slider(baseline_name) {
        var slider_group = container
            .append('g')
            .attr('id', 'slider_group_baselines')
            .attr('width', slider_group_width)
            .attr('height', slider_group_height)
            .attr('transform', `translate(${margin.left + 
                4 * indicator_image_size + 
                3 * indicator_image_padding +
                slider_group_left_padding +
                baseline_choice_width},
                ${margin.top + image_size + slider_group_top_padding})`);
        
        var ticks = [];
        var slider_text = 'Standard deviation of noise σ'
        for (i in gaussian_sigmas) {
            ticks.push({'pos': parseInt(gaussian_sigmas[i] * 2), 
                        'label': gaussian_sigmas[i]});
        }
        var slider_range = [1, 6];
        
        slider_group
            .append('text')
            .attr('x', slider_group_width / 2 - slider_group_internal_width_padding)
            .attr('y', 45)
            .attr('text-anchor', 'middle')
            .style('font-weight', 700)
            .style('font-size', '18px')
            .text(slider_text);
                
        var slider_object = slid3r()
            .width(slider_group_width - 2 * slider_group_internal_width_padding)
            .range(slider_range)
            .startPos(1)
            .clamp(true)
            .customTicks(ticks)
            .numTicks(slider_range[1])
            .label(null)
            .font('sans-serif')
            .onDrag(function(new_sigma) {
                update_slider(baseline_name, new_sigma);
            });
        
        slider_group.append('g').call(slider_object);
    }
    
    create_slider('gaussian');

    container.selectAll('text').style("font-family", "sans-serif");
    
    function image_init(image_data) {
        var images = image_group.selectAll('image').data(image_data);
        var indicator_images = indicator_group.selectAll('image').data(indicator_data);
        var baseline_images  = baseline_group.selectAll('image').data(baseline_data);
        
        //Main Images
        images.enter()
            .append('image')
            .attr('width', image_size)
            .attr('height', image_size)
            .attr('id', function(d) { 
                if (d.sigma == null)
                {
                    return d.id;
                }
                else {
                    if (d.id == 'attributions_gaussian') {
                        return d.id + Math.round(d.sigma * 2);
                    } else {
                        return d.id + Math.round(d.sigma * 2) + d.set; 
                    }
                }
            })
            .attr('xlink:href', function(d) {
                if (d.id == 'orig_image_gaussian') {
                    return base_dir + '/integrated_gradients/interpolated_image_1.00.png'
                }
                if (d.id == 'baseline_gaussian') {
                    return base_dir + `baselines/gaussian/baseline${d.set - 1}_sigma${d.sigma.toFixed(1)}.png`;
                } else if (d.id == 'attributions_gaussian') {
                    return base_dir + `baselines/gaussian/saliency_sigma${d.sigma.toFixed(1)}.png`;
                }
                else {
                    return '404.png';
                }
            })
            .attr('x', function(d) { return d.x; })
            .attr('y', function(d) { return d.y; })
            .attr('opacity', function(d) {
                if (d.sigma == current_sigma || d.sigma == null) {
                    if (d.set == null || d.set == 1) {
                        return 1.0;
                    }
                    else {
                        return 0.0;
                    }
                } else {
                    return 0.0;
                }
            });    
        
        //Indicator Images
        indicator_images.enter()
            .append('image')
            .attr('width',  indicator_image_size)
            .attr('height', indicator_image_size)
            .attr('xlink:href', function(d) {
                return 'data_gen/data/' + d.id + '/integrated_gradients/interpolated_image_1.00.png' 
            })
            .attr('id', function(d) { return d.id + '_gaussian'; })
            .attr('x', function(d) { return d.x; })
            .attr('y', function(d) { return d.y; })
            .attr('opacity', function(d) { return d.opacity; })
            .on('click', select_new_image);
            
        baseline_images.enter()
            .append('image')
            .attr('width',  baseline_choice_size)
            .attr('height', baseline_choice_size)
            .attr('xlink:href', function(d) {
                if (d.id == 'uniform') {
                    return base_dir + 'baselines/' + d.id + '/baseline.png';
                } else if (d.id == 'gaussian') {
                    return base_dir + 'baselines/' + d.id + `/baseline_sigma2.0.png`;
                }
            })
            .attr('x', function(d) { return d.x; })
            .attr('y', function(d) { return d.y; })
            .attr('opacity', function(d) { return d.opacity; })
            .on('click', select_new_baseline);
    }
    
    function select_new_baseline(row, i) {
        if (current_baseline_name == row.id) {
            return;
        }
        
        //First remove lingering sliders...
        if (current_baseline_name == 'gaussian') {
            remove_slider();
            turn_off_smoothgrad(false);
            
            var button_group = container.select('#button_group_gaussian');
            
            button_group
                .select('#sg_button_rect')
                .attr('opacity', 0.0);
            
            button_group
                .select('#sg_button_text')
                .attr('opacity', 0.0);
        }
        if (row.id == 'gaussian' && display_multi_reference) {
            var button_group = container.select('#button_group_gaussian');
            
            button_group
                .select('#sg_button_rect')
                .attr('opacity', 0.2);
            
            button_group
                .select('#sg_button_text')
                .attr('opacity', 0.2);
        }
        
        var baseline_images  = baseline_group.selectAll('image').data(baseline_data)
        baseline_images.attr('opacity', function(d) {
            if (row.id == d.id) {
                return 1.0;
            } else {
                return 0.2;
            }
        });
        
        var baseline_text = baseline_group.selectAll('text').data(baseline_data)
        baseline_text.attr('opacity', function(d) {
            if (row.id == d.id) {
                return 1.0;
            } else {
                return 0.2;
            }
        });
        
        var saliency_image = image_group.select(current_attribution_id);
        if (current_baseline_name == 'gaussian' && current_sigma > gaussian_sigmas[0])
        {
            var target_saliency_id = '#attributions_gaussian' + Math.round(gaussian_sigmas[0] * 2);
            var target_saliency_image = image_group.select(target_saliency_id);  
            target_saliency_image
                .attr('xlink:href', saliency_image.attr('xlink:href'))
                .attr('opacity', 1.0);
            saliency_image.attr('opacity', 0.0);
            current_attribution_id = target_saliency_id;
            saliency_image = target_saliency_image;
            
        }
        if (row.id == 'uniform') {
            var saliency_file = base_dir + `baselines/${row.id}/saliency.png`;
            if (display_multi_reference) {
                saliency_file = base_dir + `baselines/${row.id}/saliency_eg.png`;
            }
            cross_fade_image(saliency_image, saliency_file, image_group, 500);
        } else if (row.id == 'gaussian') {
            current_sigma = 0.5;
            reset_images('gaussian');
            create_slider('gaussian');
        }
            
        var max_set = 3;
        for (var j = 1; j <= max_set; ++j) {
            var baseline_image = image_group.select(current_baseline_id + j.toString());    
            //A little bit of d3 black magic happening here
            //we are going to swap by pivoting to the image
            //with the smallest sigma
            if (current_baseline_name == 'gaussian' && current_sigma > gaussian_sigmas[0])
            {
                var target_baseline_id = '#baseline_gaussian' + Math.round(gaussian_sigmas[0] * 2);
                var target_baseline_image = image_group.select(target_baseline_id + j.toString());
                target_baseline_image
                    .attr('xlink:href', baseline_image.attr('xlink:href'))
                    .attr('opacity', 1.0);
                baseline_image.attr('opacity', 0.0);
                current_baseline_id = target_baseline_id;
                baseline_image = target_baseline_image;
            }
            if (row.id == 'uniform') {
                var baseline_file = base_dir + `baselines/${row.id}/baseline.png`;
                if (display_multi_reference || j == 1) {
                    cross_fade_image(baseline_image, baseline_file, image_group, 500);
                }
                else {
                    baseline_image
                        .attr('xlink:href', baseline_file);
                }
            }
        }
        
        current_baseline_name = row.id;
    }
    
    function reset_images(baseline_name) {
        if (baseline_name == 'uniform') {
            var max_set = 3;

            for (var j = 1; j <= max_set; ++j) {
                var baseline_image = image_group.select(current_baseline_id + j.toString());
                var baseline_file = base_dir + `baselines/${baseline_name}/baseline.png`;
                if (display_multi_reference || j == 1) {
                    cross_fade_image(baseline_image, baseline_file, image_group, 500);
                } else {
                    baseline_image.attr('xlink:href', baseline_file);
                }
            }

            var saliency_image = image_group.select(current_attribution_id);
            var saliency_file = base_dir + `baselines/${baseline_name}/saliency.png`;
            if (display_multi_reference) {
                saliency_file = base_dir + `baselines/${baseline_name}/saliency_eg.png`;
            }
            
            cross_fade_image(saliency_image, saliency_file, image_group, 500);
       } else if (baseline_name == 'gaussian') {
           for (i in gaussian_sigmas) {
               sigma = gaussian_sigmas[i];
               
               var max_set = 3;
               for (var j = 1; j <= max_set; ++j) {
                   var baseline_id = '#baseline_gaussian' + Math.round(sigma * 2) + j.toString();
                   var baseline_image = image_group.select(baseline_id);
                   var baseline_file = base_dir + `baselines/gaussian/baseline_sigma${sigma.toFixed(1)}.png`;
                   if ((sigma == current_sigma) && 
                       (display_multi_reference || j == 1)) {
                       cross_fade_image(baseline_image, baseline_file, image_group, 500);
                   } else {
                       baseline_image.attr('xlink:href', baseline_file);
                   }
               }
               
               var saliency_id = '#attributions_gaussian' + Math.round(sigma * 2);
               var saliency_image = image_group.select(saliency_id);
               var saliency_file = base_dir + `baselines/gaussian/saliency_sigma${sigma.toFixed(1)}.png`;
               if (display_multi_reference) {
                   if (display_smooth_grad) {
                       saliency_file = base_dir + `baselines/gaussian/saliency_sg_sigma${sigma.toFixed(1)}.png`;
                   } else {
                       saliency_file = base_dir + `baselines/gaussian/saliency_eg_sigma${sigma.toFixed(1)}.png`;
                   }
               }
               
               if (sigma == current_sigma) {
                   cross_fade_image(saliency_image, saliency_file, image_group, 500);
               } else {
                   saliency_image.attr('xlink:href', saliency_file);
               }
           }
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
                return 0.2;
            }
        });
        
        base_image_name = row.id;
        base_dir = `data_gen/data/${base_image_name}/`;
        
        var display_image  = image_group.select('#orig_image_gaussian');
        var display_file  = base_dir + 'integrated_gradients/interpolated_image_1.00.png';
        cross_fade_image(display_image,  display_file,  image_group, 500);
        
        reset_images(current_baseline_name);
    }

    image_init(image_data);
}

figure_multi_ref();