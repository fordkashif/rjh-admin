import React, { Component } from "react";
import { Line } from "react-chartjs-2";

class Widget1 extends Component {
  render() {
    const data = {
      labels: [7, 6, 8, 7, 3, 8, 3, 3, 0],
      datasets: [
        {
          label: "My First dataset",
          data: [0, 5, 4, 5, 4, 5, 4, 5, 4],
          backgroundColor: "#d9c6e9",
          borderColor: "#b58ed3",
          borderWidth: 2,
          pointRadius: 1.5,         
          pointHoverBorderColor: "#b58ed3",          
          fill : true
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      tooltips: {
        enabled: false,
      },
      plugins : {
        legend: false,
      },
      scales: {
        x: 
          {
            display: false,
            grid: {
              display: false,
              drawBorder: false,
            },
            scaleLabel: {
              display: false,
              labelString: "Month",
            },
          },
        
        y: 
          {
            display: false,
            grid: {
              display: false,
              drawBorder: false,
            },
            scaleLabel: {
              display: true,
              labelString: "Value",
            },
          },
        
      },
      elements: {
        line: {
          tension: 0,
        },
       
      },
      title: {
        display: false,
      },
    };
    return (
      <div style={{ height: 150 }}>
        <Line data={data} options={options} height={150} />
      </div>
    );
  }
}

export default Widget1;
