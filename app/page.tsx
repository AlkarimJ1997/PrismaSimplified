'use client';

import { useEffect } from 'react';

const Home = () => {
	useEffect(() => {
		fetch('/api/users')
			.then(res => res.json())
			.then(data => console.log(data));
		// fetch('/api/users', {
		// 	method: 'POST',
		// 	headers: { 'Content-Type': 'application/json' },
		// })
		// 	.then(res => res.json())
		// 	.then(data => console.log(data));
	}, []);

	return <h1>Hello World</h1>;
};

export default Home;
