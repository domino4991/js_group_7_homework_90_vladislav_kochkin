import React, {useEffect, useRef, useState} from 'react';
import './App.css';

const websocket = new WebSocket('ws://localhost:8000/canvas');

function App() {
    const [state, setState] = useState({
        mouseDown: false,
        pixels: [],
        color: '#000000',
        width: 10,
        figure: 'square'
    });
    const ws = useRef(null);
    const canvas = useRef(null);

    useEffect(() => {
        ws.current = new WebSocket('ws://localhost:8000/canvas');
        ws.current.onclose = () => console.log('ws connection closed');
        ws.current.onmessage = e => {
            const data = JSON.parse(e.data);
            switch (data.type) {
                case 'NEW_PIXEL':
                    setState(prevState => ({
                        ...prevState,
                        pixels: [...prevState.pixels, data.pixel]}));
                    draw(data.pixel.x, data.pixel.y, data.pixel.color, data.pixel.width, data.pixel.figure);
                    break;
                case 'LAST_PIXELS':
                    setState(prevState => ({...prevState, pixels: [...prevState.pixels, ...data.pixels]}));
                    data.pixels.forEach(pixels => {
                        draw(pixels.x, pixels.y, pixels.color, pixels.width, pixels.figure);
                    });
                    break;
                default:
                    console.log('No data');
            }
        };
        const draw = (x, y, color, width, figure) => {
            const ctx = canvas.current.getContext('2d');
            ctx.fillStyle = color;
            switch (figure) {
                case "square":
                    ctx.fillRect(x, y, width, width);
                    break;
                case "circle":
                    ctx.beginPath();
                    ctx.arc(x, y, width, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.strokeStyle = color
                    ctx.stroke();
                    break;
                default:
                    ctx.fillRect(x, y, width, width);
                    break;
            }
        };

        return () => ws.current.close();
    }, []);

    const canvasMouseMoveHandler = e => {
        if (state.mouseDown) {
            e.persist();
            const ctx = canvas.current.getContext('2d');
            const rect = canvas.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            ctx.fillStyle = state.color;
            switch (state.figure) {
                case "square":
                    ctx.fillRect(x, y, state.width, state.width);
                    break;
                case "circle":
                    ctx.beginPath();
                    ctx.arc(x, y, state.width, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.strokeStyle = state.color
                    ctx.stroke();
                    break;
                default:
                    ctx.fillRect(x, y, state.width, state.width);
                    break;
            }
            const pixel = {
                type: 'CREATE_PIXELS',
                pixel: {
                    x,
                    y,
                    color: state.color,
                    width: state.width,
                    figure: state.figure
                }
            };
            websocket.send(JSON.stringify(pixel));
        }
    };

    const mouseDownHandler = () => {
        setState({...state, mouseDown: true});
    };

    const mouseUpHandler = event => {
        const rect = canvas.current.getBoundingClientRect();
        const pixel = {
            type: "CREATE_PIXELS",
            pixel: {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
                color: state.color,
                width: state.width,
                figure: state.figure
            }
        };
        websocket.send(JSON.stringify(pixel));
        setState({...state, mouseDown: false, pixels: []});
    };

    const onChangeField = e => {
        const name = e.target.name;
        const value = e.target.value;
        setState(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

  return (
    <div className="App">
      <h1 style={{textAlign: 'center'}}>Canvas</h1>
        <div className="controlsBox">
            <label htmlFor='color'>Цвет: </label>
            <input
                id="color"
                type="color"
                name="color"
                value={state.color}
                onChange={e => onChangeField(e)}
                className='Control-input'
            />
            <label htmlFor='width'>Ширина кисти: </label>
            <input
                id="width"
                type='text'
                name='width'
                value={state.width}
                onChange={e => onChangeField(e)}
                className='Control-input'
            />
            <label htmlFor='figure'>Тип кисти: </label>
            <select
                id='figure'
                name='figure'
                value={state.figure}
                onChange={e => onChangeField(e)}
                className='Control-input'
            >
                <option value='square'>Квадрат</option>
                <option value='circle'>Круг</option>
            </select>
        </div>
        <div style={{margin: '0 auto', width: '800px'}}>
            <canvas
                ref={canvas}
                style={{border: '1px solid black'}}
                width='800'
                height='600'
                onMouseMove={canvasMouseMoveHandler}
                onMouseUp={mouseUpHandler}
                onMouseDown={mouseDownHandler}
            />
        </div>
    </div>
  );
}

export default App;
