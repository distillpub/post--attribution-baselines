function figure_baseline_comp() {
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
    var current_sigma = 5.0;
    var current_baseline_name = 'blur';
    var current_baseline_id   = '#baseline_blur' + current_sigma;
    var current_attribution_id = '#attributions_blur' + current_sigma;
    var base_dir = `data_gen/data/${base_image_name}/`;

    var blur_sigmas = [5.0, 10.0, 15.0, 20.0, 25.0, 30.0, 35.0, 40.0, 45.0, 50.0];
    var gaussian_sigmas = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];

    var image_data = [];
    for (i in blur_sigmas) {
        sigma = blur_sigmas[i];
        image_data.push({
            x: 0, y: 0, id: 'baseline_blur', sigma: sigma
        });
        image_data.push({
            x: 2 * (image_size + image_padding), y: 0, id: 'attributions_blur', sigma: sigma
        });
    }
    image_data.push({
        x: image_size + image_padding, y: 0, id: 'orig_image_blur', sigma: null
    });
    
    var title_data = [
        { x: 0, y: 0, id: 'baseline_blur', title: 'Baseline Image'},
        { x: image_size + image_padding, y: 0, id: 'orig_image_blur', title: 'Original Image'},
        { x: 2 * (image_size + image_padding), y: 0, id: 'attributions_blur', title: 'Pixel Attributions'}
    ];

    var indicator_data = [
        { x: 0, y: 0, id: 'goldfinch', opacity: 1.0},
        { x: 1 * (indicator_image_size + indicator_image_padding), y: 0, id: 'rubber_eraser', opacity: 0.2 },
        { x: 2 * (indicator_image_size + indicator_image_padding), y: 0, id: 'house_finch', opacity: 0.2 },
        { x: 3 * (indicator_image_size + indicator_image_padding), y: 0, id: 'killer_whale', opacity: 0.2 }
    ]
    
    var baseline_data = [
        { x: text_width, y: 0, id: 'max_dist', opacity: 0.2 },
        { x: text_width, y: 1 * (indicator_image_size + indicator_image_padding), id: 'blur',     opacity: 1.0 },
        { x: text_width, y: 2 * (indicator_image_size + indicator_image_padding), id: 'uniform',  opacity: 0.2 },
        { x: text_width, y: 3 * (indicator_image_size + indicator_image_padding), id: 'gaussian', opacity: 0.2 },
    ]

    var container = d3.select('#figure_baseline_comp_div')
                        .append('svg')
                        .attr('width',  '100%')
                        .attr('height', '100%')
                        .style('min-width', `${(width + margin.left + margin.right ) / 2}px`)
                        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);

    var image_group = container
        .append('g')
        .attr('id', 'image_group_blur')
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
        .attr('id', 'indicator_group_blur')
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

    function remove_slider() {
        var slider_group = container.select('#slider_group_baselines');
        slider_group.remove();
    }
    
    function update_slider(baseline_name, new_sigma) {
        var select_sigma_new = Math.round(new_sigma) * 5;
        
        if (baseline_name == 'blur') {
            new_sigma = Math.round(new_sigma) * 5;
            var select_sigma_old = current_sigma;
        } else if (baseline_name == 'gaussian') {
            new_sigma = Math.round(new_sigma) / 2.0;
            var select_sigma_old = current_sigma * 10;
        }
        
        if (new_sigma != current_sigma) {
            image_group.select('#baseline_blur' + select_sigma_old)
                .attr('opacity', 0.0);
            image_group.select('#attributions_blur' + select_sigma_old)
                .attr('opacity', 0.0);
            
            image_group.select('#baseline_blur' + select_sigma_new)
                .attr('opacity', 1.0);
            image_group.select('#attributions_blur' + select_sigma_new)
                .attr('opacity', 1.0);     
        }
             
        current_sigma = new_sigma;
        
        current_baseline_id   = '#baseline_blur' + select_sigma_new;
        current_attribution_id = '#attributions_blur' + select_sigma_new;
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
        if (baseline_name == 'blur') {
            var slider_text = 'Smoothing constant σ'
            for (i in blur_sigmas) {
                ticks.push({'pos': parseInt(blur_sigmas[i] / 5), 
                            'label': blur_sigmas[i]});
            }
            var slider_range = [1, 10];
        } else if (baseline_name == 'gaussian') {
            var slider_text = 'Standard deviation of noise σ'
            for (i in gaussian_sigmas) {
                ticks.push({'pos': parseInt(gaussian_sigmas[i] * 2), 
                            'label': gaussian_sigmas[i]});
            }
            var slider_range = [1, 6];
        }
        
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
    
    create_slider('blur');

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
                    return d.id + d.sigma; 
                }
            })
            .attr('xlink:href', function(d) {
                if (d.id == 'orig_image_blur') {
                    return base_dir + '/integrated_gradients/interpolated_image_1.00.png'
                }
                if (d.id == 'baseline_blur') {
                    return base_dir + `baselines/blur/baseline_sigma${d.sigma.toFixed(1)}.png`;
                } else if (d.id == 'attributions_blur') {
                    return base_dir + `baselines/blur/saliency_sigma${d.sigma.toFixed(1)}.png`;
                }
                else {
                    return '404.png';
                }
            })
            .attr('x', function(d) { return d.x; })
            .attr('y', function(d) { return d.y; })
            .attr('opacity', function(d) {
                if (d.sigma == current_sigma || d.sigma == null) {
                    return 1.0;
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
            .attr('id', function(d) { return d.id + '_blur'; })
            .attr('x', function(d) { return d.x; })
            .attr('y', function(d) { return d.y; })
            .attr('opacity', function(d) { return d.opacity; })
            .on('click', select_new_image);
            
        baseline_images.enter()
            .append('image')
            .attr('width',  baseline_choice_size)
            .attr('height', baseline_choice_size)
            .attr('xlink:href', function(d) {
                if (d.id == 'uniform' ||
                    d.id == 'max_dist') {
                    return base_dir + 'baselines/' + d.id + '/baseline.png';
                } else if (d.id == 'blur') {
                    return base_dir + 'baselines/' + d.id + `/baseline_sigma25.0.png`;
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
        if (current_baseline_name == 'blur' || 
            current_baseline_name == 'gaussian') {
            remove_slider();
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
        
        var baseline_image = image_group.select(current_baseline_id);
        var saliency_image = image_group.select(current_attribution_id);
        //A little bit of d3 black magic happening here
        //we are going to swap by pivoting to the image
        //with the smallest sigma
        if ((current_baseline_name == 'blur' && current_sigma > blur_sigmas[0]) ||
            (current_baseline_name == 'gaussian' && current_sigma > gaussian_sigmas[0]))
            {
            var target_baseline_id = '#baseline_blur' + blur_sigmas[0];
            var target_saliency_id = '#attributions_blur' + blur_sigmas[0];
            
            var target_baseline_image = image_group.select(target_baseline_id)
            var target_saliency_image = image_group.select(target_saliency_id)
            
            target_baseline_image
                .attr('xlink:href', baseline_image.attr('xlink:href'))
                .attr('opacity', 1.0);
            target_saliency_image
                .attr('xlink:href', saliency_image.attr('xlink:href'))
                .attr('opacity', 1.0);
            
            baseline_image.attr('opacity', 0.0);
            saliency_image.attr('opacity', 0.0);
            
            current_baseline_id = target_baseline_id;
            current_attribution_id = target_saliency_id;
            baseline_image = target_baseline_image;
            saliency_image = target_saliency_image;
        }
        
        if (row.id == 'max_dist' ||
            row.id == 'uniform') {
                
            var baseline_file = base_dir + `baselines/${row.id}/baseline.png`;
            var saliency_file = base_dir + `baselines/${row.id}/saliency.png`;
            
            cross_fade_image(baseline_image, baseline_file, image_group, 500);
            cross_fade_image(saliency_image, saliency_file, image_group, 500);
            
        } else if (row.id == 'blur') {
            current_sigma = 5.0;
            reset_images('blur');
            create_slider('blur');
        } else if (row.id == 'gaussian') {
            current_sigma = 0.5;
            reset_images('gaussian');
            create_slider('gaussian');
        }
        
        current_baseline_name = row.id;
    }
    
    function reset_images(baseline_name) {
        if (baseline_name == 'blur') {
            for (i in blur_sigmas) {
                sigma = blur_sigmas[i];
                
                var baseline_id = '#baseline_blur' + sigma
                var saliency_id = '#attributions_blur' + sigma
                
                var baseline_image = image_group.select(baseline_id);
                var saliency_image = image_group.select(saliency_id);
                
                var baseline_file = base_dir + `baselines/blur/baseline_sigma${sigma.toFixed(1)}.png`;
                var saliency_file = base_dir + `baselines/blur/saliency_sigma${sigma.toFixed(1)}.png`;
                
                if (sigma == current_sigma) {
                    cross_fade_image(baseline_image, baseline_file, image_group, 500);
                    cross_fade_image(saliency_image, saliency_file, image_group, 500);
                } else {
                    baseline_image.attr('xlink:href', baseline_file);
                    saliency_image.attr('xlink:href', saliency_file);
                }
            }
        } else if (baseline_name == 'uniform' || 
                   baseline_name == 'max_dist') {
           var baseline_image = image_group.select(current_baseline_id);
           var saliency_image = image_group.select(current_attribution_id);
           
           var baseline_file = base_dir + `baselines/${baseline_name}/baseline.png`;
           var saliency_file = base_dir + `baselines/${baseline_name}/saliency.png`;
           
           cross_fade_image(baseline_image, baseline_file, image_group, 500);
           cross_fade_image(saliency_image, saliency_file, image_group, 500);
       } else if (baseline_name == 'gaussian') {
           for (i in gaussian_sigmas) {
               sigma = gaussian_sigmas[i];
               blur_sigma = blur_sigmas[i];
               
               var baseline_id = '#baseline_blur' + blur_sigma
               var saliency_id = '#attributions_blur' + blur_sigma
               
               var baseline_image = image_group.select(baseline_id);
               var saliency_image = image_group.select(saliency_id);
               
               var baseline_file = base_dir + `baselines/gaussian/baseline_sigma${sigma.toFixed(1)}.png`;
               var saliency_file = base_dir + `baselines/gaussian/saliency_sigma${sigma.toFixed(1)}.png`;
               
               if (sigma == current_sigma) {
                   cross_fade_image(baseline_image, baseline_file, image_group, 500);
                   cross_fade_image(saliency_image, saliency_file, image_group, 500);
               } else {
                   baseline_image.attr('xlink:href', baseline_file);
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
        
        var display_image  = image_group.select('#orig_image_blur');
        var display_file  = base_dir + 'integrated_gradients/interpolated_image_1.00.png';
        cross_fade_image(display_image,  display_file,  image_group, 500);
        
        reset_images(current_baseline_name);
    }

    image_init(image_data);
}

figure_baseline_comp();