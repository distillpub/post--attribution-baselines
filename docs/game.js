function game()
{
    var margin = ({
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
    });
    
    var width = 500;
    var height = 225;
    
    var side_length = 200;
    var top_x = 125;
    var top_y = 25;
    var radius = 30;
    var line_pad = 1.1
    var circle_data = [
        {text: 'A', id: 'circle_a', cx: top_x, cy: top_y, fill: 'MediumSpringGreen'},
        {text: 'B', id: 'circle_b', cx: top_x - side_length * 0.5, cy: top_y + (side_length) * 0.5 * Math.sqrt(3), fill: 'LightSalmon'},
        {text: 'C', id: 'circle_c', cx: top_x + side_length * 0.5, cy: top_y + (side_length) * 0.5 * Math.sqrt(3), fill: 'LightSkyBlue'}
    ]
    var line_data = [
        {id: 'line_ab', x1: circle_data[0].cx - (radius + line_pad) * 0.5, 
                        y1: circle_data[0].cy + (radius + line_pad) * 0.5 * Math.sqrt(3) + Math.sqrt(3), 
                        x2: circle_data[1].cx + (radius + line_pad) * 0.5, 
                        y2: circle_data[1].cy - (radius + line_pad) * 0.5 * Math.sqrt(3)},
        {id: 'line_ac', x1: circle_data[0].cx + (radius + line_pad) * 0.5, 
                        y1: circle_data[0].cy + (radius + line_pad) * 0.5 * Math.sqrt(3), 
                        x2: circle_data[2].cx - (radius + line_pad) * 0.5, 
                        y2: circle_data[2].cy - (radius + line_pad) * 0.5 * Math.sqrt(3)},
        {id: 'line_bc', x1: circle_data[1].cx + radius + line_pad * 2.0, y1: circle_data[1].cy, 
                        x2: circle_data[2].cx - radius - line_pad * 2.0, y2: circle_data[2].cy}
    ]
    
    var container = d3.select('#game')
        .append('svg')
        .attr('width',  '100%')
        .attr('height', '100%')
        .style('min-width', `${(width + margin.left + margin.right ) / 2}px`)
        .style('max-width', `${width + margin.left + margin.right}px`)
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);
    
    var circle_group = container
        .append('g')
        .attr('id', 'circle_group')
        .attr('width', width)
        .attr('height', height)
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    var circle_set = new Set([]);
    var grant_dict = {
        '': '$0',
        'a': '$10,000',
        'b': '$5,000',
        'c': '$7,500',
        'ab': '$14,000',
        'ac': '$15,000',
        'bc': '$20,000',
        'abc': '$25,000'
    }
    
    function handle_mouseover(d, i, nodes) {
        var id = d.id;
        if (!circle_set.has(id)) {
            var circle = circle_group.select('#' + id);
            var text   = circle_group.select('#text_' + id);
            circle.style('opacity', 0.4);
            text.style('opacity', 0.4);
        }
    }
    
    function handle_mouseout(d, i, nodes) {
        var id = d.id;
        if (!circle_set.has(id)) {
            var circle = circle_group.select('#' + id);
            var text   = circle_group.select('#text_' + id);
            circle.style('opacity', 0.3); 
            text.style('opacity', 0.3);
        }
    }
        
    function handle_click(d, i, nodes) {
        var id = d.id;
        var circle = circle_group.select('#' + id);
        var text   = circle_group.select('#text_' + id);
        if (circle_set.has(id)) {
            circle_set.delete(id);
            circle.style('opacity', 0.4); 
            text.style('opacity', 0.4);
            circle_set.forEach(function(currentValue, currentKey) {
                var line_id = 'line_' 
                    + [id.split('_')[1], 
                       currentKey.split('_')[1]].sort().join('');
                var line = circle_group.select('#' + line_id);
                line.style('opacity', 0.3);
            })
        }
        else {
            circle_set.forEach(function(currentValue, currentKey) {
                var line_id = 'line_' 
                    + [id.split('_')[1], 
                       currentKey.split('_')[1]].sort().join('');
                var line = circle_group.select('#' + line_id);
                line.style('opacity', 1.0);
            })
            circle_set.add(id);
            circle.style('opacity', 1.0);
            text.style('opacity', 1.0); 
        }
        
        var grant_amount_text = circle_group.select('#grant-text');
        var members = [];
        circle_set.forEach(function(currentValue, currentKey) {
            members.push(currentKey.split('_')[1]);
        });
        member_string = members.sort().join('');
        grant_amount_text.text(grant_dict[member_string]);
    }
    
    circle_group.selectAll('circle')
        .data(circle_data)
        .enter()
        .append('circle')
        .style('stroke', 'black')
        .style('stroke-width', '5px')
        .style('fill', function(d) { return d.fill; })
        .style('opacity', 0.3)
        .attr('id', function(d) { return d.id; })
        .attr("r", radius)
        .attr("cx", function(d) { return d.cx; })
        .attr("cy", function(d) { return d.cy; })
        .on('mouseover', handle_mouseover)
        .on('mouseout', handle_mouseout)
        .on('click', handle_click);
    
    circle_group.selectAll('text')
        .data(circle_data)
        .enter()
        .append('text')
        .text(function(d) { return d.text; })
        .attr('id', function(d) { return 'text_' + d.id; })
        .attr('x', function(d) { return d.cx; })
        .attr('y', function(d) { return d.cy + 28.0/3.0; })
        .attr('text-anchor', 'middle')
        .style('font-weight', 700)
        .style('font-size', 28.0)
        .style("font-family", "sans-serif")
        .style('opacity', 0.3)
        .attr('pointer-events', 'none');
        
    circle_group.selectAll('line')
        .data(line_data)
        .enter()
        .append('line')
        .style('stroke', 'black')
        .style('stroke-width', '5px')
        .style('opacity', 0.3)
        .attr('id', function(d) { return d.id })
        .attr("x1", function(d) { return d.x1; })
        .attr("y1", function(d) { return d.y1; })
        .attr("x2", function(d) { return d.x2; })
        .attr("y2", function(d) { return d.y2; });
        
    circle_group.append('text')
        .attr('x', top_x + 100)
        .attr('y', top_y + 50)
        .style('font-weight', 700)
        .style('font-size', 32.0)
        .style("font-family", "sans-serif")
        .style('opacity', 1.0)
        .attr('pointer-events', 'none')
        .text('Grant Funding:');
        
    circle_group.append('text')
        .attr('x', top_x + 215)
        .attr('y', top_y + 100)
        .style('font-weight', 700)
        .style('font-size', 32.0)
        .style("font-family", "sans-serif")
        .style('opacity', 1.0)
        .attr('pointer-events', 'none')
        .attr('text-anchor', 'middle')
        .text('$0')
        .attr('id', 'grant-text');
}

game();