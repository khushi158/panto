import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  CircularProgress,
  Alert,
  Divider,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { FolderOutlined, ErrorOutline } from '@mui/icons-material';
import { supabase } from '../../supabase/supabse';





const theme = createTheme({
  palette: {
    primary: {
      main: '#FC6D26', // GitLab orange
    },
    secondary: {
      main: '#172B4D', // GitLab navy
    },
  },
});

const GitLab = ({ accessToken }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggledProjects, setToggledProjects] = useState({});

  useEffect(() => {
    const fetchProjects = async () => {
      const tokenFromStorage = JSON.parse(localStorage.getItem('sb-xeenlebcqjfumsblubuy-auth-token'));
      const token = tokenFromStorage?.provider_token;

      if (!token) {
        setError('Access token is missing');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('https://gitlab.com/api/v4/projects?membership=true', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        setProjects(data);

        // Check if each project is already in the Supabase reviews table
        const userName = tokenFromStorage?.user?.id; // Assuming user_id is available in the token
        const toggledState = {};

        for (const project of data) {
          const { data: reviewData, error: reviewError } = await supabase
            .from('Review')
            .select('repo_id')
            .eq('repo_id', project.id)
            .eq('user_id', userName);

          if (reviewError) {
            console.error('Error fetching reviews:', reviewError);
          } else {
            toggledState[project.id] = reviewData.length > 0;
          }
        }

        setToggledProjects(toggledState);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [accessToken]);

  const handleToggle = async (projectId, isChecked) => {
    const tokenFromStorage = JSON.parse(localStorage.getItem('sb-xeenlebcqjfumsblubuy-auth-token'));
    const token = tokenFromStorage?.provider_token;
    const userName = tokenFromStorage?.user.id;

    if (!token || !userName) {
      setError('User or token missing');
      return;
    }

    try {
      if (isChecked) {
        // Add to Supabase if not already added
        const { error } = await supabase
          .from('Review')
          .insert([{ user_id: userName, repo_id: projectId }]);

        if (error) {
          console.error('Error inserting review:', error);
        } else {
          setToggledProjects((prev) => ({ ...prev, [projectId]: true }));
        }
      } else {
        // Remove from Supabase if already present
        const { error } = await supabase
          .from('Review')
          .delete()
          .eq('repo_id', projectId)
          .eq('user_id', userName);

        if (error) {
          console.error('Error deleting review:', error);
        } else {
          setToggledProjects((prev) => ({ ...prev, [projectId]: false }));
        }
      }
    } catch (error) {
      console.error('Error handling toggle:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={2}>
        <Alert severity="error" icon={<ErrorOutline />}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box m={2}>
        <Card>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              <FolderOutlined /> GitLab Projects
            </Typography>
            <List>
              {projects.map((project) => (
                <React.Fragment key={project.id}>
                  <ListItem>
                    <Checkbox
                      checked={toggledProjects[project.id] || false}
                      onChange={(e) => handleToggle(project.id, e.target.checked)}
                    />
                    <ListItemText primary={project.name} secondary={project.description} />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
};

export default GitLab;
