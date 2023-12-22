import express, { Express } from "express";
import {addPoll, listPolls, loadPoll, votePoll } from './routes';
import bodyParser from 'body-parser';


// Configure and start the HTTP server.
const port: number = 4510;
const app: Express = express();
app.use(bodyParser.json());
app.get("/api/list", listPolls);
app.post("/api/add", addPoll);
app.post("/api/vote", votePoll);
app.get("/api/load", loadPoll);
app.listen(port, () => console.log(`Server listening on ${port}`));

app.use(express.static('public'));