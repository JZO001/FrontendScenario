import "react-resizable/css/styles.css";
import './App.css';

import React from 'react';
import { ResizableBox } from 'react-resizable';
import SearchPanel from './components/SearchPanel';

class App extends React.Component<{}> {

  render() {
    return (
      <ResizableBox
        className="resizable-box center-hort-vert"
        width={220}
        height={248}
        minConstraints={[220, 248]}>
        <SearchPanel />
      </ResizableBox>
    );
  }

}

export default App;
