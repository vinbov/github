import React, { useState } from 'react';

const KeywordInputForm = () => {
  const [keyword, setKeyword] = useState('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (keyword.trim()) {
      // Call the API to fetch keyword data
      const response = await fetch(`/api/keywords?keyword=${encodeURIComponent(keyword)}`);
      const data = await response.json();
      console.log(data); // Handle the response data as needed
    }
  };

  return (
    <form onSubmit={handleSubmit} className="keyword-input-form">
      <label htmlFor="keyword" className="block text-sm font-medium text-gray-700">
        Enter Keyword:
      </label>
      <input
        type="text"
        id="keyword"
        value={keyword}
        onChange={handleInputChange}
        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
        placeholder="Type a keyword..."
      />
      <button type="submit" className="mt-2 bg-blue-500 text-white rounded-md p-2">
        Search
      </button>
    </form>
  );
};

export default KeywordInputForm;