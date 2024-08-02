/** Class representing the line chart view. */
class LineChart {
  /**
   * Creates a LineChart
   * @param globalApplicationState The shared global application state (has the data and map instance in it)
   */
  constructor(globalApplicationState) {
    // Set some class level variables
    this.globalApplicationState = globalApplicationState;

    let owidCovidData = globalApplicationState.covidData;
    // Filter data to get continents only
    const continentsData = owidCovidData.filter(d => d.iso_code.startsWith('OWID'));

    console.log("continentsData", continentsData);
    // Group data by continents and then by location
    this.groupedData = d3.group(continentsData, d => d.location);
    console.log("groupedData", this.groupedData);

    const countriesData = owidCovidData.filter(d => !d.iso_code.startsWith('OWID'));
    this.groupDataCountriesData = d3.group(countriesData, d => d.iso_code);
    console.log("countriesData", countriesData);
    console.log("groupDataCountriesData", this.groupDataCountriesData);

    const lineChartElement = document.getElementById("line-chart");
    const computedStyle = window.getComputedStyle(lineChartElement);
    const widthStr = computedStyle.getPropertyValue("width");
    const heightStr = computedStyle.getPropertyValue("height");

    // Removes "px" and converts to a number
    this.width = parseInt(widthStr, 10); 
    this.height = parseInt(heightStr, 10);
    this.margin = { top: 20, right: 20, bottom: 50, left: 70 };


    this.width = this.width - this.margin.left - this.margin.right;
    this.height = this.height - this.margin.top - this.margin.bottom;
    console.log("Width:", this.width);
    console.log("Height:", this.height);
    this.selectedColor = [];
    this.maxColors = 20;
    // Define an array of colors
    this.colors = ['red', 'blue', 'green', 'orange', 'purple', 
      'pink', 'brown', 'cyan', 'magenta', 'lavender', 'teal', 'indigo', 
      'violet', 'salmon', 'olive', 'maroon', 'grey', 'navy', 'black', 'yellow'];
    this.drawContinents();
  }

  // Choose a color ensuring no repetition
  chooseColorWithNoRepetition() {
    for (let i = 0; i < this.colors.length; i += 1) {
      if (!this.selectedColor.includes(i)) {
        this.selectedColor.push(i);
        return this.colors[i];
      }
    }
    console.log("all corlors are selected");
    this.selectedColor.splice(0, this.maxColors);
    for (let i = 0; i < this.colors.length; i += 1) {
      if (!this.selectedColor.includes(i)) {
        this.selectedColor.push(i);
        return this.colors[i];
      }
    }
    return 0;
  }

  clearAllCorlor(i) {
    this.selectedColor.splice(0);
  }

  drawContinents() {
    this.clearAxisesAndLines();
    const svg = d3.select("#line-chart")
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
    let maxContinentCases = 0.0;
    let timeValue = this.groupedData.values().next().value;
    for (const [continent, locations] of this.groupedData) {
      //console.log('Continent:', continent);
      if (continent == 'Asia') {
        timeValue = locations;
      }
      locations.forEach(element => {
        //console.log('before element :', element );
        element.date = new Date(element.date);
        //console.log('element.date :', element.date);
        let cases = parseFloat(element.total_cases_per_million)
        if (cases > maxContinentCases) {
          maxContinentCases = cases;
        }
      });
    }

    const yScale = d3.scaleLinear()
      .domain([0, maxContinentCases]) // Calculate the domain
      .range([this.height, 0]); // Set the range

    // Calculate the extent (min and max date values)
    const dateExtent = d3.extent(timeValue, d => d.date);
    console.log("dateExtent", dateExtent);

    const tickValues = d3.timeMonth
        .every(3)
        .range(dateExtent[0], dateExtent[1])
        .concat([dateExtent[1]])// Ensure the largest date is included
        .concat([dateExtent[0]]); 

    //console.log("tickValues", tickValues);

    // Create an xScale that uses the date extent for the domain
    console.log("width here:", this.width);
    const xScale = d3.scaleTime()
        .domain(dateExtent)
        .range([0, this.width]);

    // Create the x-axis
    const svgXAxis = d3.select("#x-axis")
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
    //  console.log("tickValues 1", tickValues);
    svgXAxis.append("g")
      .attr("transform", `translate(0,${this.height})`)
      .call(d3.axisBottom(xScale)
      .tickValues(tickValues)
      .tickFormat(d3.timeFormat("%b %Y")))
      .attr("class", "text");

    // Create Y-axis
    const svgYAxis = d3.select("#y-axis")
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
    svgYAxis.append("g")
        .call(d3.axisLeft(yScale));

    // X-axis label
    svg.append("text")
      .attr("class", "x label")
      .attr("text-anchor", "middle")
      .attr("x", this.width / 2)
      .attr("y", this.height + 30)
      .text("Date")
      .attr("class", "TitleText");

    // Y-axis label
    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "middle")
        .attr("y", -this.margin.left)
        .attr("x", -this.height / 2)
        .attr("dy", "1.2em")
        .attr("transform", "rotate(-90)")
        .text("Case Per Million")
        .attr("class", "TitleText");
    
    // Create the line generator
    const line = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.total_cases_per_million));

    const svgLines = d3.select("#lines")
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    const colorMap = new Map();
    for (const [continent, val] of this.groupedData) {
      let c = this.chooseColorWithNoRepetition();
      colorMap.set(continent, c);
      svgLines.append("path")
        .datum(val)
        .attr("class", "line line-chart-setting")
        .attr("d", line)
        .attr("stroke", `${c}`);
    }

    const svg3 = d3.select('#line-chart');

    function onMouseMove(event, margin, width, height, groupedData) {
      // Get the current mouse position relative to the SVG
      let [x, y] = d3.pointer(event);
      
      
      const valuesAtVerticalLine = [];
      svg3.select('.vertical-line').attr('x1', x).attr('x2', x);

      // Check if the mouse position is within the chart area
      if (x >= margin.left && x <= width + margin.left) {
        x -= margin.left;
        const xdate = xScale.invert(x); // Convert the x-coordinate to a date
        //console.log("x:", x);
        //console.log("xdate:", xdate);
        if (svg3.select('.vertical-line').empty()) {
          svg3.append('line')
            .attr('class', 'vertical-line')
            .attr('y1', margin.top)
            .attr('y2', height + 20)
            .style('stroke', 'black');
          
        }
        // Show the vertical line at the mouse position
        svg3.select('.vertical-line-text').remove();
        let i = 0;
        let closestPoints = [];
        //console.log("groupedData", groupedData);
        for (const [continent, val] of groupedData) {
          if (typeof val == 'undefined') {
            continue;
          }

          // Find the data point closest to the x-coordinate
          let closestPoint = val[0];
          for (let j = 1; j < val.length; j+=1) {
              if (Math.abs(closestPoint.date - xdate) >= Math.abs(val[j].date - xdate)) {
                closestPoint = val[j];
              }
          }
          //console.log("closestPoint", closestPoint);
          closestPoints.push(closestPoint);
          // Get the closest point
          i += 1;
        }
        
        closestPoints.sort((a, b) => parseFloat(b.total_cases_per_million) > parseFloat(a.total_cases_per_million));
        //console.log("closestPoints:", closestPoints);
        //console.log("closestPoints:", closestPoints);
    
        for (let t = 0; t < closestPoints.length; t+=1) {
          svg3.append('text')
          .attr('class', 'vertical-line-text')
          .attr('id', `c${t}`)
          .attr('x', margin.left + 10)
          .attr('y', margin.top + 10)
          .style('display', 'none');

          let c = colorMap.get(closestPoints[t].location);
          //console.log("color:", c);

          svg3.select(`#c${t}`)
            .attr('class', 'vertical-line-text')
            .attr('x', x > width - 50 ? x - 150 : x)
            .attr('y', margin.top + 12 * t)
            .style('fill', `${c}`)
            .text(`${closestPoints[t].location} : ${closestPoints[t].total_cases_per_million}`)
            .style('display', 'block');
          }
      } else {
        // Hide the line and text if the mouse is outside the chart area
        svg3.select('.vertical-line').attr('x1', -1).attr('x2', -1);
        svg3.select('.vertical-line').remove();
        svg3.selectAll('.vertical-line-text').remove();
      }
    }
    svg3.on('mousemove', (event) => onMouseMove(event, this.margin, this.width, 
        this.height, this.groupedData));
  }

  drawGraph() {
    this.clearAxisesAndLines();
    let dateExtent = [];
    let maxContinentCases = 0.0;
    let cnt = 0;
    for (let i = 0; i < this.globalApplicationState.selectedLocations.length; i += 1) {
      let country = this.globalApplicationState.selectedLocations[i];
      let data = this.groupDataCountriesData.get(country);
      if (typeof data == 'undefined') {
        continue;
      }
      cnt += 1;
      data.forEach(element => {
        //console.log('before element :', element );
        element.date = new Date(element.date);
        //console.log('element.date :', element.date);
        let cases = parseFloat(element.total_cases_per_million)
        if (cases > maxContinentCases) {
          maxContinentCases = cases;
        }
      });
      //console.log("country in get Date Extent:", country);
      
      // Create Date objects using d3.timeParse

      const tmpDateExtent = d3.extent(data, d => d.date);
      
      if (dateExtent.length == 0) {
        dateExtent = tmpDateExtent;
      } else {
        if (tmpDateExtent[0] < dateExtent[0]) {
          dateExtent[0] = tmpDateExtent[0];
        }
        if (tmpDateExtent[1] > dateExtent[1]) {
          dateExtent[1] = tmpDateExtent[1];
        }
      }
    }

    if (cnt == 0) {
      console.log("No selected country!");
      this.drawContinents();
      return;
    }

    //console.log("dateExtent", dateExtent);
    const tickValues = d3.timeMonth
      .every(3)
      .range(dateExtent[0], dateExtent[1])
      .concat([dateExtent[1]])// Ensure the largest date is included
      .concat([dateExtent[0]]); 
    
    // Create an xScale that uses the date extent for the domain
    const xScale = d3.scaleTime()
        .domain(dateExtent)
        .range([0, this.width]);
    //console.log("tickValues", tickValues);
    //console.log("this.margin.left", this.margin.left, " ,this.margin.top", this.margin.top);
    const svgXAxis = d3.select("#x-axis")
        .append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
        .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
      // Create the x-axis
      svgXAxis.append("g")
        .attr("transform", `translate(0,${this.height})`)
        .call(d3.axisBottom(xScale)
        .tickValues(tickValues)
        .tickFormat(d3.timeFormat("%b %Y")))
        .attr("class", "text");
  

    const svgYAxis = d3.select("#y-axis")
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    const yScale = d3.scaleLinear()
      .domain([0, maxContinentCases]) // Calculate the domain
      .range([this.height, 0]); // Set the range

    // Create Y-axis
    svgYAxis.append("g")
      .call(d3.axisLeft(yScale));

    // Create the line generator
  
    const svgLines = d3.select("#lines")
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    const colorMap = new Map();
    for (let i = 0; i < this.globalApplicationState.selectedLocations.length; i += 1) {
      const line = d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.total_cases_per_million));
      let country = this.globalApplicationState.selectedLocations[i];
      //console.log("country to draw lines", country);
      let val = this.groupDataCountriesData.get(country);
      if (typeof val == 'undefined') {
        continue;
      }
      let c = this.chooseColorWithNoRepetition();
      colorMap.set(country, c);

      svgLines.append("path")
        .datum(val)
        .attr("class", "line line-chart-setting")
        .attr("d", line)
        .attr("stroke", c);
    }

    const svg2 = d3.select('#line-chart');

    function onMouseMove(event, margin, width, height, 
          globalApplicationState, groupDataCountriesData) {
      // Get the current mouse position relative to the SVG
      let [x, y] = d3.pointer(event);
      const valuesAtVerticalLine = [];
      svg2.select('.vertical-line').attr('x1', x).attr('x2', x);
        
      // Check if the mouse position is within the chart area
      if (x >= margin.left && x <= width + margin.left) {
        x -= margin.left;
        const xdate = xScale.invert(x); // Convert the x-coordinate to a date
        if (svg2.select('.vertical-line').empty()) {
          svg2.append('line')
            .attr('class', 'vertical-line')
            .attr('y1', margin.top)
            .attr('y2', height + 20)
            .style('stroke', 'black');
          
        }
        // Show the vertical line at the mouse position
        svg2.selectAll('.vertical-line-text').remove();
        let closestPoints = [];
        for (let i = 0; i < globalApplicationState.selectedLocations.length; i += 1) {
          let country = globalApplicationState.selectedLocations[i];
          //console.log("country to draw lines", country);
          let val = groupDataCountriesData.get(country);
          if (typeof val == 'undefined') {
            continue;
          }
          
          // Find the data point closest to the x-coordinate
          let closestPoint = val[0];
          for (let j = 1; j < val.length; j+=1) {
              if (Math.abs(closestPoint.date - xdate) >= Math.abs(val[j].date - xdate)) {
                closestPoint = val[j];
              }
          }
          closestPoints.push(closestPoint);
          //console.log("x", x, " xdate", xdate);

          // Add the closest point's value to the array
          valuesAtVerticalLine.push({
              lineIndex: i,
              x: closestPoint.date,
              y: closestPoint.total_cases_per_million,
          });
          if (closestPoint) {

          }
        }
        closestPoints.sort((a, b) => parseFloat(b.total_cases_per_million) > parseFloat(a.total_cases_per_million));
        //console.log("closestPoints:", closestPoints);
        //console.log("colorMap:", colorMap);
        //console.log(closestPoints);
        for (let t = 0; t < closestPoints.length; t+=1) {
          svg2.append('text')
          .attr('class', 'vertical-line-text')
          .attr('id', `t${t}`)
          .attr('x', margin.left + 10)
          .attr('y', margin.top + 10)
          .style('display', 'none');
          let c = colorMap.get(closestPoints[t].iso_code);
          svg2.select(`#t${t}`)
            .attr('class', 'vertical-line-text')
            .attr('x', x > width - 50 ? x - 150 : x)
            .attr('y', margin.top + 12 * t)
            .style('fill', `${c}`)
            .text(`${closestPoints[t].location} : ${closestPoints[t].total_cases_per_million}`)
            .style('display', 'block');
        }

        //console.log("valuesAtVerticalLine:", valuesAtVerticalLine);
      } else {
        // Hide the line and text if the mouse is outside the chart area
        svg2.select('.vertical-line').attr('x1', -1).attr('x2', -1);
        svg2.select('.vertical-line').remove();
        svg2.selectAll('.vertical-line-text').remove();
      }
    }
    svg2.on('mousemove', (event) => onMouseMove(event, this.margin, this.width, 
        this.height, this.globalApplicationState, this.groupDataCountriesData));
  }

  clearAxisesAndLines() {
    this.clearAllCorlor();
    var chartContainer = d3.select("#x-axis");
    chartContainer.selectAll("*").remove();
    //console.log("remove x axis");
    chartContainer = d3.select("#y-axis");
    chartContainer.selectAll("*").remove();
    //console.log("remove y axis");
    chartContainer = d3.select("#lines");
    chartContainer.selectAll("*").remove();
    //console.log("remove lines text");
    d3.selectAll(".vertical-line-text").remove();
   //console.log("remove lines text");
  }

  updateSelectedCountries (clickedCountry) {
    let data = this.groupDataCountriesData.get(clickedCountry);
    if (typeof data == 'undefined') {
      console.log("can not find the data of the clickedCountry:", clickedCountry);
      return;
    }
    this.selectedColor.splice(0);
    this.drawGraph();
  }
}