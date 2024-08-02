class PieChart {
    constructor(globalApplicationState) {
      this.globalApplicationState = globalApplicationState;
      this.initChart();
    }
  
    initChart() {
      const pieChartElement = document.getElementById("pie-chart");
      const computedStyle = window.getComputedStyle(pieChartElement);
      const widthStr = computedStyle.getPropertyValue("width");
      const heightStr = computedStyle.getPropertyValue("height");
  
      this.width = parseInt(widthStr, 10);
      this.height = parseInt(heightStr, 10);
      this.radius = Math.min(this.width, this.height) / 2;
  
      this.svg = d3.select("#pie-chart")
        .attr("width", this.width)
        .attr("height", this.height)
        .append("g")
        .attr("transform", `translate(${this.width / 2},${this.height / 2})`);
  
      this.color = d3.scaleOrdinal()
        .domain(this.globalApplicationState.covidData.map(d => d.location))
        .range(d3.schemeCategory10);
  
      this.pie = d3.pie()
        .value(d => d.total_cases_per_million);
  
      this.arc = d3.arc()
        .innerRadius(0)
        .outerRadius(this.radius);
  
      this.updateChart();
    }
  
    updateChart() {
      const data = this.globalApplicationState.covidData.filter(d => !d.iso_code.startsWith('OWID'));
      const pieData = this.pie(data);
  
      this.svg.selectAll('path')
        .data(pieData)
        .enter()
        .append('path')
        .attr('d', this.arc)
        .attr('fill', d => this.color(d.data.location))
        .attr('stroke', 'white')
        .attr('stroke-width', 1.5)
        .on('mouseover', (event, d) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr('d', d3.arc().innerRadius(0).outerRadius(this.radius + 10));
        })
        .on('mouseout', (event, d) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr('d', this.arc);
        });
  
      this.svg.selectAll('text')
        .data(pieData)
        .enter()
        .append('text')
        .attr('transform', d => `translate(${this.arc.centroid(d)})`)
        .attr('dy', '0.35em')
        .text(d => d.data.location)
        .style('text-anchor', 'middle')
        .style('font-size', '10px');
    }
  }
  