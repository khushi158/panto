import React, { useEffect, useState } from 'react';
import { Button, CircularProgress, Typography, Card, CardContent, CardActions, Badge } from '@mui/material';
import { supabase } from '../../supabase/supabse';

const LoadingSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </div>
);

const Repositories = ({ username, accessToken, provider }) => {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRepos, setSelectedRepos] = useState(new Set());

  useEffect(() => {
    const fetchRepositories = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = '';
        let headers = {};

        // Set URL and headers based on the selected provider
        if (provider === 'github') {
          url = `https://api.github.com/users/${username}/repos`;
        } else if (provider === 'gitlab') {
          url = `https://gitlab.com/api/v4/projects?membership=true`;
          headers = { Authorization: `Bearer ${accessToken}` };
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
          throw new Error(`Failed to fetch repositories from ${provider}`);
        }

        const data = await response.json();

        // Normalize data for uniform display
        const normalizedRepos = data.map((repo) => ({
          id: String(repo.id || repo.uuid), // Convert ID to string
          name: repo.name,
          description: repo.description,
          language: repo.language,
          created_at: repo.created_at || repo.created_on,
          updated_at: repo.updated_at || repo.updated_on,
          html_url: repo.html_url || repo.links?.html?.href,
        }));

        setRepos(normalizedRepos);

        // Fetch reviews from Supabase
        const { data: reviews, error: reviewError } = await supabase
          .from('Review')
          .select('repo_id')
          .eq('user_id', username);

        if (reviewError) {
          throw new Error('Failed to fetch reviews from Supabase');
        }

        // Convert review repo_ids to strings and create a Set
        const reviewedRepos = new Set(reviews.map(review => String(review.repo_id)));
        console.log('Reviewed repos:', reviewedRepos);
        console.log('Normalized repos:', normalizedRepos.map(repo => repo.id));
        
        setSelectedRepos(reviewedRepos);
        
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (accessToken && username && provider) {
      fetchRepositories();
    }
  }, [accessToken, username, provider]);

  const handleRepoSelection = async (repoId) => {
    try {
      const newSelectedRepos = new Set(selectedRepos);
      repoId = String(repoId); // Convert repoId to string for consistent comparison
      
      if (newSelectedRepos.has(repoId)) {
        const { error: deleteError } = await supabase
          .from('Review')
          .delete()
          .eq('user_id', username)
          .eq('repo_id', repoId);

        if (deleteError) throw deleteError;

        newSelectedRepos.delete(repoId);
        console.log('Repository removed from Review table');
      } else {
        const { error: insertError } = await supabase
          .from('Review')
          .insert([
            {
              user_id: username,
              repo_id: repoId,
              created_at: new Date().toISOString(),
            },
          ]);

        if (insertError) throw insertError;

        newSelectedRepos.add(repoId);
        console.log('Repository added to Review table successfully');
      }

      setSelectedRepos(newSelectedRepos);
    } catch (error) {
      console.error('Error handling repository selection:', error.message);
      setError('Failed to update repository selection. Please try again.');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div style={{ backgroundColor: 'red', color: 'white', padding: '10px', borderRadius: '5px' }}>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px' }}>
      <Typography variant="h4" gutterBottom>Your Repositories</Typography>

      {repos.length > 0 ? (
        <div>
          {repos.map((repo) => (
            <Card key={repo.id} style={{ marginBottom: '20px' }}>
              <CardContent>
                <Typography variant="h6">
                  <a href={repo.html_url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold', color: 'blue' }}>
                    {repo.name}
                  </a>
                  <Badge color="primary" style={{ marginLeft: '10px' }}>
                    {repo.language || 'Not specified'}
                  </Badge>
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <strong>Description:</strong> {repo.description || 'No description available'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <strong>Created:</strong> {new Date(repo.created_at).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <strong>Last Updated:</strong> {new Date(repo.updated_at).toLocaleDateString()}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  color={selectedRepos.has(String(repo.id)) ? 'success' : 'default'}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRepoSelection(repo.id);
                  }}
                >
                  {selectedRepos.has(String(repo.id)) ? 'Selected' : 'Select'}
                </Button>
              </CardActions>
            </Card>
          ))}
        </div>
      ) : (
        <Typography variant="body1" color="textSecondary">No repositories found</Typography>
      )}
    </div>
  );
};

export default Repositories;