import React from 'react';
import Layout from './layout';
import KeywordInputForm from './components/keyword-input-form';
import KeywordResultsTable from './components/keyword-results-table';
import { useState } from 'react';

const Page = () => {
  const [keywords, setKeywords] = useState([]);
  
  const handleKeywordSubmit = async (newKeywords) => {
    // Fetch keyword data from the API
    const response = await fetch('/api/keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keywords: newKeywords }),
    });
    
    if (response.ok) {
      const data = await response.json();
      setKeywords(data);
    } else {
      console.error('Failed to fetch keyword data');
    }
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold">Keyword Research Tool</h1>
      <KeywordInputForm onSubmit={handleKeywordSubmit} />
      <KeywordResultsTable keywords={keywords} />
    </Layout>
  );
};

export default Page;