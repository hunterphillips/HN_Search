import React from "react";
import axios from "axios";
import "./App.css";
import lightOn from "./assets/lightbulb_on.png";
import lightOff from "./assets/lightbulb_off.png";
import commentIcon from "./assets/comment.png";

// HN Search API https://hn.algolia.com/api
const API_ENDPOINT = "https://hn.algolia.com/api/v1/";
const currentTime = new Date().toLocaleTimeString();

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			searchTerm: localStorage.getItem("storedSearch") || "",
			query: "",
			data: [],
			sortProp: "points",
			lightOn: this.isDayTime(),
		};
		this.sortList = this.sortList.bind(this);
	}

	isDayTime() {
		let hr = Number(currentTime.split(":")[0]);
		let tod = currentTime.split(" ")[1];
		return (
			(tod === "AM" && hr >= 7 && hr < 12) ||
			(tod === "PM" && (hr < 8 || hr === 12))
		);
	}

	componentDidMount() {
		// onload > get last saved search OR get latest stories
		return this.state.searchTerm
			? this.getStories(`search?query=${this.state.searchTerm}`)
			: this.resetList();
	}

	getStories = (query = "") => {
		// GET request > update state.data
		return axios
			.get(`${API_ENDPOINT}${query}`)
			.then((res) => this.setState({ data: res.data.hits }))
			.catch((error) => console.log(error));
	};

	handleSearchSubmit = (e) => {
		// on search submit > use searchTerm in GET request > update state.data
		e.preventDefault();
		localStorage.setItem("storedSearch", this.state.searchTerm);
		this.getStories(`search?query=${this.state.searchTerm}`).then(() => {
			this.sortList(this.state.data, this.state.sortProp);
		});
	};

	resetList = () => {
		// reset to default list of latest stories
		this.getStories("search_by_date?tags=story").then(() => {
			this.sortList(this.state.data, this.state.sortProp);
		});
		this.setState({ searchTerm: "", query: "" });
		localStorage.setItem("storedSearch", "");
	};

	sortList(list, prop) {
		let newList = [...list];
		// descending order on Points and Date
		if (prop === "points" || prop === "created_at")
			newList.sort((a, b) => (a[prop] < b[prop] ? 1 : -1));
		else {
			newList.sort((a, b) => (a[prop] > b[prop] ? 1 : -1));
		}
		this.setState({ data: newList, sortProp: prop });
	}

	render() {
		const filteredList = this.state.data.filter(
			(item) =>
				item.title.toLowerCase().startsWith(this.state.query) ||
				item.author.toLowerCase().startsWith(this.state.query)
		);

		return (
			<div
				className="App"
				// light/dark mode
				style={{
					backgroundColor: this.state.lightOn
						? "rgb(246, 246, 239)"
						: "#282c34",
				}}
			>
				<div style={{ position: "relative" }}>
					<h1 className="AppHeader" onClick={this.resetList}>
						HN Search
					</h1>
					<img
						className="lightBulb"
						onClick={() => this.setState({ lightOn: !this.state.lightOn })}
						src={this.state.lightOn ? lightOn : lightOff}
						alt="lightbulb"
					/>
				</div>
				<form
					className="formWrap"
					onSubmit={this.handleSearchSubmit}
					style={{
						color: this.state.lightOn ? "#303030" : "white",
					}}
				>
					<div className="formElementWrap" style={{ paddingRight: "1em" }}>
						<label htmlFor="search">Search: </label>
						<input
							id="search"
							type="text"
							value={this.state.searchTerm}
							onChange={(e) => this.setState({ searchTerm: e.target.value })}
						></input>
						<button type="submit" disabled={!this.state.searchTerm}>
							Submit
						</button>
					</div>
					<div className="formElementWrap">
						<label htmlFor="filter">Filter: </label>
						<input
							id="filter"
							type="text"
							onChange={(e) =>
								this.setState({ query: e.target.value.toLowerCase() })
							}
						/>
					</div>
				</form>
				<DataTable
					list={filteredList}
					sortList={this.sortList}
					sortProp={this.state.sortProp}
					lightOn={this.state.lightOn}
				/>
			</div>
		);
	}
}

const DataTable = ({ list, sortList, sortProp, lightOn }) => {
	const altURL = "https://news.ycombinator.com/item?id="; // if item url is null

	const setHeaderStyle = (prop) => {
		return prop === sortProp ? { textDecoration: "underline" } : {};
	};

	return (
		<div className="tableWrap">
			<table
				className="dataTable"
				style={{
					color: lightOn ? "#6e6e6e" : "white",
				}}
			>
				<tbody>
					<tr>
						<th
							className="titleCol sortHeader"
							style={setHeaderStyle("title")}
							onClick={() => sortList(list, "title")}
						>
							title
						</th>
						<th className="linkCol linkHeader">url</th>
						<th
							className="sortHeader"
							style={setHeaderStyle("author")}
							onClick={() => sortList(list, "author")}
						>
							author
						</th>
						<th
							className="sortHeader"
							style={setHeaderStyle("points")}
							onClick={() => sortList(list, "points")}
						>
							points
						</th>
						<th
							className="dateCol dateHeader sortHeader"
							style={setHeaderStyle("created_at")}
							onClick={() => sortList(list, "created_at")}
						>
							date
						</th>
					</tr>
					{list.map((item) => (
						<tr key={item.objectID}>
							<td className="titleCol">{item.title}</td>
							<td className="linkCol">
								<a
									href={item.url ? item.url : `${altURL}${item.objectID}`}
									className="App-link"
									target="_blank"
									rel="noreferrer"
								>
									link
								</a>
								<span className="linkSeparator">|</span>
								<a
									href={`${altURL}${item.objectID}`}
									className="App-link"
									target="_blank"
									rel="noreferrer"
								>
									<img
										className="commentIcon"
										src={commentIcon}
										alt="comment"
									/>
								</a>
							</td>
							<td className="authorCol">{item.author}</td>
							<td className="pointCol">{item.points}</td>
							<td className="dateCol">{item.created_at.split("T")[0]}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default App;
