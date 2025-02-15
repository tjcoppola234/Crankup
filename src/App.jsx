
import React from "react";
import "./blk-design-system-react.css";
import { Navigate } from "react-router-dom";

class App extends React.Component {
  constructor(props) {
    super(props)
    // initialize our state
    this.state = {
      loggedin: true,
      currUser: "",
      userRespNum: -1,
      posts: [],
      displayMakePost: false,
      displayMakeResponse: [],
      displayViewResponses: [],
      tempRespData: []
    }
    this.loginStatus();
    this.load();
  }

  load() {
    fetch('/collDocs', {
      method: 'post',
      'no-cors': true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ "name": "posts" })
    })
      .then(response => response.json())
      .then(json => {
        console.log(json);
        this.setState({ posts: json })
      });
  }

  numResponses(username) {
    fetch('/userInfo', {
      method: 'post',
      'no-cors': true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: username })
    })
      .then(response => response.json())
      .then(json => {
        if (json[0] !== undefined) {
          this.setState({ userRespNum: json[0].responses.length })
        }
      });
  }

  loginStatus() {
    fetch('/loginStatus', {
      method: 'get',
      'no-cors': true,
      headers: { 'Content-Type': 'application/json' }
    })
      .then(response => response.json())
      .then(json => {
        this.setState({ loggedin: json.login, currUser: json.user })
        this.numResponses(json.user);
      })
  }

  makePost(e) {
    e.preventDefault();
    fetch('/addPost', {
      method: 'post',
      'no-cors': true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: this.state.currUser, comment: document.getElementById("makePostComment").value, responses: [] })
    })
    this.setState({ displayMakePost: false });
    this.load();
  }

  showMakePost() {
    if (this.state.displayMakePost) {
      return (
        <form id="makePost">
          <label for="makePostComment">What would you like to hear?</label>
          <input id="makePostComment" type="text" />
          <button type="submit" onClick={e => this.makePost(e)}>Submit</button>
          <button type="button" onClick={() => this.setState({ displayMakePost: false })}>Cancel</button>
        </form>
      );
    }
  }

  displayPost(post, i) {
    return (
      <li>
        Comment: {post.comment}
        <button type="button" onClick={() => {
          let arr = this.state.displayMakeResponse;
          arr[i] = true;
          this.setState({ displayMakeResponse: arr })
        }}>Respond</button>
        <input id="viewrespbtn" type="button" value={this.state.displayViewResponses[i] === true ? "Hide Responses" : "View Responses"} onClick={(e) => {
          this.load();
          let arr = this.state.displayViewResponses;
          if (arr[i] === true) {
            arr[i] = false;
            this.setState({ displayViewResponses: arr })
          } else {
            arr[i] = true;
            this.setState({ displayViewResponses: arr })
          }

          if (this.state.posts[i].responses !== undefined) {
            let repdataArr = this.state.tempRespData;
            repdataArr[i] = [];
            this.setState({ tempRespData: repdataArr })
            for (let j = 0; j < this.state.posts[i].responses.length; j++) {
              fetch('/collDoc', {
                method: 'post',
                'no-cors': true,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collName: "responses", _id: this.state.posts[i].responses[j] })
              })
                .then(result => result.json())
                .then(json => {
                  let dataArr = this.state.tempRespData;
                  dataArr[i].push(json[0])
                  this.setState({ tempRespData: dataArr })
                })
            }
          }
        }}></input>
        {this.showViewResponses(i)}
        {this.showMakeResponse(i)}
      </li>
    );
  }

  makeResponse(e, i) {
    e.preventDefault();

    fetch('/addResp', {
      method: 'post',
      'no-cors': true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: this.state.currUser,
        song: document.getElementById("makeResponseSong").value,
        artist: document.getElementById("makeResponseArtist").value,
        comment: document.getElementById("makeResponseComment").value
      })
    })
      .then(response => response.json())
      .then(json => {
        fetch('/updatePostNewResponse', {
          method: 'post',
          'no-cors': true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ _id: this.state.posts[i]._id, responseid: json.insertedId })
        });
      })

    let arr = this.state.displayMakeResponse;
    arr[i] = false;
    this.setState({ displayMakeResponse: arr })
  }

  showMakeResponse(i) {
    if (this.state.displayMakeResponse[i]) {
      return (
        <form id="makeResponse">
          <div>Paste a Spotify URL in the Song field to embed your song suggestion!</div>
          <label for="makeResponseSong">Song: </label>
          <input id="makeResponseSong" type="text" />
          <label for="makeResponseArtist">Artist: </label>
          <input id="makeResponseArtist" type="text" />
          <label for="makeResponseComment">Comment: </label>
          <input id="makeResponseComment" type="text" />
          <button type="submit" onClick={e => this.makeResponse(e, i)}>Submit</button>
          <button type="button" onClick={() => {
            let arr = this.state.displayMakeResponse;
            arr[i] = false;
            this.setState({ displayMakeResponse: arr })
          }}>Cancel</button>
        </form>
      );
    }
  }

  showViewResponses(i) {
    if (this.state.displayViewResponses[i] && this.state.tempRespData[i] !== undefined && this.state.tempRespData[i].length > 0) {
      const jsx = (
        <ul>
          {this.state.tempRespData[i].map((entry, j) => {
            if (entry !== null && Object.keys(entry).length !== 0) {
              console.log(this.state.tempRespData)
              return this.showResponseData(i, j)
            }
          })}
        </ul>
      );
      return jsx;
    }
  }
  showResponseData(i, j) {
    const re = new RegExp('^(https:\/\/open.spotify.com\/track\/|spotify:track:)([a-zA-Z0-9]+)(.*)$');
    if (re.test(this.state.tempRespData[i][j].song)) {
      return (
        <li>
          Comment: {this.state.tempRespData[i][j].comment}&emsp;
          <br></br>
          <iframe src="https://open.spotify.com/embed/track/59gWVl266pGc6ofxIIaWnn?utm_source=generator" width="100%" height="100" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
        </li>
      )
    }
    else {
      return (
        <li>
          Song: {this.state.tempRespData[i][j].song}&emsp;Artist: {this.state.tempRespData[i][j].artist}&emsp;Comment: {this.state.tempRespData[i][j].comment}
        </li>
      )
    }
  }

  render() {
    if (this.state.loggedin == false) {
      return (
        <Navigate replace to="/login" />
      );
    } else {
      return (
        <>
          <h1>
            Hello {this.state.currUser}&emsp;&emsp;&emsp;Total Responses Made: {this.state.userRespNum}
          </h1>
          <button type="button" onClick={() => window.location.reload()}>Refresh Everything</button>
          <div id="displayPosts">
            <button type="button" onClick={() => this.setState({ displayMakePost: true })}>Make Post</button>
            {this.showMakePost()}
            <ul>
              {this.state.posts.map((post, i) => this.displayPost(post, i))}
            </ul>
          </div>
        </>
      );
    }
  }
}

export default App;
