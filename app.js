document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check if LightweightCharts is available
        if (typeof window.LightweightCharts === 'undefined') {
            throw new Error('LightweightCharts library is not loaded. Please check your internet connection and try again.');
        }

        // Fetch the data
        const response = await fetch('spacePledged');
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        
        // Sort data by block height
        data.sort((a, b) => a.block - b.block);
        
        // Process data for chart
        const chartData = data.map(item => {
            // Extract the numeric value before PiB
            const match = item.space_pledged_formatted.match(/(\d+\.\d+)/);
            return {
                time: item.block, // Using block height as time
                value: match ? parseFloat(match[0]) : 0,
                solutionRange: item.solution_range,
                blockHeight: item.block,
                formattedSpace: item.space_pledged_formatted
            };
        });
        
        // Calculate statistics
        const spaceValues = chartData.map(item => item.value);
        const minSpace = Math.min(...spaceValues);
        const maxSpace = Math.max(...spaceValues);
        const currentSpace = spaceValues[spaceValues.length - 1];
        
        // Calculate growth rate (PiB per 1000 blocks)
        const firstBlock = chartData[0].blockHeight;
        const lastBlock = chartData[chartData.length - 1].blockHeight;
        const firstSpace = chartData[0].value;
        const lastSpace = chartData[chartData.length - 1].value;
        const blocksElapsed = lastBlock - firstBlock;
        const spaceGrowth = lastSpace - firstSpace;
        const growthRate = (spaceGrowth / blocksElapsed) * 1000;
        
        // Update statistics display
        document.getElementById('min-space').textContent = `${minSpace.toFixed(2)} PiB`;
        document.getElementById('max-space').textContent = `${maxSpace.toFixed(2)} PiB`;
        document.getElementById('current-space').textContent = `${currentSpace.toFixed(2)} PiB`;
        document.getElementById('growth-rate').textContent = `${growthRate.toFixed(2)} PiB/1000 blocks`;
        
        // Create chart using lightweight-charts
        const chartOptions = {
            layout: {
                background: { color: 'transparent' },
                textColor: '#e2e8f0',
            },
            width: document.getElementById('spaceChart').clientWidth,
            height: document.getElementById('spaceChart').clientHeight,
            timeScale: {
                borderColor: 'rgba(197, 203, 206, 0.3)',
                timeVisible: true,
                secondsVisible: false,
                barSpacing: 5,
            },
            rightPriceScale: {
                borderColor: 'rgba(197, 203, 206, 0.3)',
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                },
            },
            grid: {
                vertLines: {
                    color: 'rgba(30, 41, 59, 0.5)',
                },
                horzLines: {
                    color: 'rgba(30, 41, 59, 0.5)',
                },
            },
            crosshair: {
                mode: 1, // Using numeric value instead of enum
                vertLine: {
                    color: '#3b82f6',
                    width: 1,
                    style: 2, // Using numeric value instead of enum
                },
                horzLine: {
                    color: '#3b82f6',
                    width: 1,
                    style: 2, // Using numeric value instead of enum
                },
            },
            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
            },
            handleScale: {
                mouseWheel: true,
                pinch: true,
                axisPressedMouseMove: true,
            },
        };
        
        const chart = window.LightweightCharts.createChart(document.getElementById('spaceChart'), chartOptions);
        
        // Create tooltip element
        const tooltipContainer = document.createElement('div');
        tooltipContainer.className = 'tooltip-container';
        document.body.appendChild(tooltipContainer);
        
        // Add area series
        const areaSeries = chart.addAreaSeries({
            topColor: 'rgba(16, 185, 129, 0.7)',
            bottomColor: 'rgba(59, 130, 246, 0.1)',
            lineColor: '#3b82f6',
            lineWidth: 2,
            priceFormat: {
                type: 'price',
                precision: 2,
                minMove: 0.01,
            },
            title: 'Space Pledged (PiB)',
        });
        
        // Set the data
        areaSeries.setData(chartData);
        
        // Set visible range to show all data
        chart.timeScale().fitContent();
        
        // Setup tooltip
        chart.subscribeCrosshairMove(param => {
            if (param.point === undefined || !param.time || param.point.x < 0 || param.point.y < 0) {
                tooltipContainer.style.display = 'none';
                return;
            }
            
            const dataPoint = chartData.find(d => d.time === param.time);
            if (!dataPoint) {
                tooltipContainer.style.display = 'none';
                return;
            }
            
            const tooltipWidth = 200;
            const tooltipHeight = 100;
            const chartRect = document.getElementById('spaceChart').getBoundingClientRect();
            let left = param.point.x + chartRect.left;
            let top = param.point.y + chartRect.top;
            
            // Adjust tooltip position to ensure it stays within window
            if (left + tooltipWidth > window.innerWidth) {
                left = left - tooltipWidth;
            }
            
            if (top + tooltipHeight > window.innerHeight) {
                top = top - tooltipHeight;
            }
            
            tooltipContainer.style.display = 'block';
            tooltipContainer.style.left = left + 'px';
            tooltipContainer.style.top = top + 'px';
            
            tooltipContainer.innerHTML = `
                <p><strong>Block Height:</strong> ${dataPoint.blockHeight.toLocaleString()}</p>
                <p><strong>Space Pledged:</strong> ${dataPoint.formattedSpace}</p>
                <p><strong>Solution Range:</strong> ${dataPoint.solutionRange.toLocaleString()}</p>
            `;
        });
        
        // Handle chart resizing
        window.addEventListener('resize', () => {
            chart.applyOptions({
                width: document.getElementById('spaceChart').clientWidth,
                height: document.getElementById('spaceChart').clientHeight,
            });
        });
        
        // Add zoom reset button
        const resetZoomButton = document.createElement('button');
        resetZoomButton.innerText = 'Reset Zoom';
        resetZoomButton.style.position = 'absolute';
        resetZoomButton.style.top = '10px';
        resetZoomButton.style.right = '10px';
        resetZoomButton.style.padding = '5px 10px';
        resetZoomButton.style.backgroundColor = 'var(--accent-color)';
        resetZoomButton.style.color = 'white';
        resetZoomButton.style.border = 'none';
        resetZoomButton.style.borderRadius = '4px';
        resetZoomButton.style.cursor = 'pointer';
        resetZoomButton.style.zIndex = '100';
        resetZoomButton.style.opacity = '0.8';
        resetZoomButton.style.transition = 'opacity 0.2s';
        
        resetZoomButton.addEventListener('mouseenter', () => {
            resetZoomButton.style.opacity = '1';
        });
        
        resetZoomButton.addEventListener('mouseleave', () => {
            resetZoomButton.style.opacity = '0.8';
        });
        
        resetZoomButton.addEventListener('click', () => {
            chart.timeScale().fitContent();
        });
        
        document.querySelector('.chart-container').appendChild(resetZoomButton);
        
    } catch (error) {
        console.error('Error loading chart:', error);
        document.querySelector('.chart-container').innerHTML = `
            <div style="text-align: center; color: #ef4444; padding: 50px;">
                <h2>Error Loading Chart</h2>
                <p>${error.message}</p>
            </div>
        `;
    }
}); 