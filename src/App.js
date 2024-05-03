import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import EditorThreeJs from "./Components/EditorThreeJs";
import GoogleMap from "./Components/GoogleMap";
import './index.scss'
function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/map">
          <GoogleMap></GoogleMap>
        </Route>
        <Route path="/">
          <EditorThreeJs></EditorThreeJs>
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
