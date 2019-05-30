var container = d3.select('body')
                    .append('svg')
                    .attrs({ width: 500, height: 500 });
var chart = container.append('g')
    .attr('id', 'chart');

chart.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 500)
    .attr('height', 500)
    .attr('fill', '#42adf4');

// container.append('svg:image')
//     .attr('x', 0)
//     .attr('y', 0)
//     .attr('width', 300)
//     .attr('height', 300)
//     .attr("xlink:href", "data_gen/data/slic_mask.png");

// var slider = d3
//     .sliderHorizontal()
//     .min(0)
//     .max(10)
//     .step(1)
//     .width(300);

// container.
//     .attr('x', 0)
//     .attr('y', 400)
//     .attr('width', 500)
//     .attr('height', 100)
//     .call(slider);
