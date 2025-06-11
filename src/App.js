import React, { useState, useEffect, useRef } from 'react';

// Firebase imports (placeholder - not directly used for AI analysis in this specific app,
// but included in case of future expansion with user authentication/storage)
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';

function App() {
  // State variables for user input (Track Analyzer)
  const [trackTitle, setTrackTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [desiredVibe, setDesiredVibe] = useState('');
  const [notes, setNotes] = useState('');
  const [songSourceContext, setSongSourceContext] = useState('');

  // State variables for AI suggestions (Track Analyzer)
  const [suggestions, setSuggestions] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); 

  // State variables for Playlist Creator
  const [playlistTheme, setPlaylistTheme] = useState('');
  const [playlistIdeas, setPlaylistIdeas] = useState([]); 
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistError, setPlaylistError] = useState(''); 

  // State variables for Setlist Blueprint Generator
  const [eventDescription, setEventDescription] = useState('');
  const [setlistBlueprint, setSetlistBlueprint] = useState(null); 
  const [setlistLoading, setSetlistLoading] = useState(false);
  const [setlistError, setSetlistError] = useState(''); 

  // State variables for Genre Fusion Suggestor
  const [genresToFuse, setGenresToFuse] = useState('');
  const [fusionIdeas, setFusionIdeas] = useState(null);
  const [fusionLoading, setFusionLoading] = useState(false);
  const [fusionError, setFusionError] = useState('');

  // Track Performance Guide 
  // Ensure consistent naming for state variables related to Track Performance Guide
  const [trackPerformanceGuideTitle, setTrackPerformanceGuideTitle] = useState('');
  const [trackPerformanceGuideArtist, setTrackPerformanceGuideArtist] = useState('');
  const [trackPerformanceGuideVibe, setTrackPerformanceGuideVibe] = useState('');
  const [trackPerformanceGuideData, setTrackPerformanceGuideData] = useState(null); 
  const [trackPerformanceGuideLoading, setTrackPerformanceGuideLoading] = useState(false);
  const [trackPerformanceGuideError, setTrackPerformanceGuideError] = useState('');


  // Refs for scrolling to sections
  const trackAnalyzerRef = useRef(null);
  const playlistCreatorRef = useRef(null);
  const setlistBlueprintRef = useRef(null);
  const genreFusionRef = useRef(null); 
  const trackPerformanceRef = useRef(null); 


  // State for Firebase (for potential future expansion with user authentication/storage)
 

  // Initialize Firebase and handle authentication
  useEffect(() => {
    let app = null;
    let authInstance = null;
    try {
      // Safely access global variables, which might not exist outside the Canvas environment
      const rawFirebaseConfig = typeof window !== 'undefined' && typeof window.__firebase_config !== 'undefined' ? window.__firebase_config : null;
      const initialAuthToken = typeof window !== 'undefined' && typeof window.__initial_auth_token !== 'undefined' ? window.__initial_auth_token : null;

      if (rawFirebaseConfig) { 
        const firebaseConfig = JSON.parse(rawFirebaseConfig);
        app = initializeApp(firebaseConfig);
        authInstance = getAuth(app);
        setFirebaseApp(app);
        setAuth(authInstance);

        const authenticate = async () => {
          try {
            if (initialAuthToken) {
              await signInWithCustomToken(authInstance, initialAuthToken);
              console.log("Signed in with custom token.");
            } else {
              await signInAnonymously(authInstance);
              console.log("Signed in anonymously.");
            }
            setUserId(authInstance.currentUser?.uid || crypto.randomUUID()); 
          } catch (e) {
            console.error("Firebase authentication error:", e);
            setError("Authentication failed. Some features may be limited. Check console for details.");
            setUserId(crypto.randomUUID()); 
          }
        };
        authenticate();
      } else {
        console.warn("Firebase config not found. Running without Firebase authentication. This is expected outside the Canvas environment unless explicitly configured.");
        setUserId(crypto.randomUUID()); 
      }
    } catch (e) {
      console.error("Failed to initialize Firebase or parse config:", e);
      setError("Failed to initialize the application fully. Check console for details.");
      setUserId(crypto.randomUUID()); 
    }
  }, []); 

  // Clear functions for each section
  const handleClearTrackAnalysis = () => {
    setTrackTitle(''); setArtist(''); setDesiredVibe(''); setNotes(''); setSongSourceContext('');
    setSuggestions(null); setLoading(false); setError('');
  };

  const handleClearPlaylistCreator = () => {
    setPlaylistTheme(''); setPlaylistIdeas([]); setPlaylistLoading(false); setPlaylistError('');
  };

  const handleClearSetlistBlueprint = () => {
    setEventDescription(''); setSetlistBlueprint(null); setSetlistLoading(false); setSetlistError('');
  };

  const handleClearGenreFusion = () => {
    setGenresToFuse(''); setFusionIdeas(null); setFusionLoading(false); setFusionError('');
  };

  // Corrected: Use the new state variable names consistently
  const handleClearTrackPerformanceGuide = () => {
    setTrackPerformanceGuideTitle(''); 
    setTrackPerformanceGuideArtist(''); 
    setTrackPerformanceGuideVibe(''); 
    setTrackPerformanceGuideData(null); 
    setTrackPerformanceGuideLoading(false); 
    setTrackPerformanceGuideError('');
  };

  // Function to scroll to a ref
  const scrollToSection = (ref) => {
    if (ref.current) { 
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };


  const getTrackAnalysisSuggestions = async () => {
    setLoading(true);
    setError('');
    setSuggestions(null); 

    if (!trackTitle || !artist || !desiredVibe) {
      setError("Please fill in Track Title, Artist, and Desired Vibe. These fields are required.");
      setLoading(false);
      return;
    }

    const prompt = `
      Analyze the following music track details and provide structured suggestions for organizing a DJ library.
      Focus on genre refinement, mood tagging, harmonic mixing, and practical cue point ideas.
      Provide a list of 7 highly similar songs from well-known artists that match the vibe and are within the same genre as the input song. These suggestions should be very accurate and aim to find songs exactly like the one described.
      Additionally, provide a list of 2 similar songs from lesser-known or emerging artists that fit the same vibe and genre, for discovery purposes.
      
      Track Title: "${trackTitle}"
      Artist: "${artist}"
      Desired Vibe/Mood for a set: "${desiredVibe}"
      Any specific notes/problems with this track: "${notes || 'N/A'}"
      Song Source/Context (e.g., YouTube URL, description from a DJ pool): "${songSourceContext || 'N/A'}"

      Consider the track's potential for different set types (e.g., warm-up, peak-time, cool-down).
      Infer the genre, BPM, and Key based on the provided text details of the song.
      Provide output strictly in the JSON format defined by the schema.
    `;

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            suggestedGenre: { "type": "STRING", "description": "AI's inferred primary genre for the track based on text input. Be specific but concise." },
            suggestedSubGenres: { "type": "ARRAY", "items": { "type": "STRING" }, "description": "AI's inferred sub-genres for the track (e.g., 'Deep House', 'Electro Pop')." },
            suggestedMoods: { "type": "ARRAY", "items": { "type": "STRING" }, "description": "AI's suggested moods/vibes for the track (e.g., 'Energetic', 'Chill', 'Driving', 'Euphoric')." },
            suggestedKey: { "type": "STRING", "description": "AI's inferred musical key for the track (e.g., '5A', 'A minor')." },
            suggestedBPMRange: { "type": "STRING", "description": "AI's inferred optimal BPM range for the track (e.g., '125-128 BPM')." },
            suggestedEnergyLevel: { "type": "STRING", "description": "AI's suggested energy level (e.g., 'Low', 'Medium', 'High', 'Peak')." },
            suggestedCuePoints: {
              "type": "ARRAY",
              "items": {
                "type": "OBJECT",
                "properties": {
                  "description": { "type": "STRING", "description": "Description of the cue point (e.g., 'Intro', 'Main Drop', 'Vocals In', 'Breakdown', 'Outro Fade')." }
                }
              },
              "description": "AI's suggested important cue points and their descriptions for a typical DJ mix. Do not include time stamps."
            },
            harmonicMixingSuggestions: { "type": "ARRAY", "items": { "type": "STRING" }, "description": "AI's suggestions for harmonically compatible keys/tracks, possibly in Camelot notation or standard key notation." },
            highlySimilarSongs: { "type": "ARRAY", "items": { "type": "STRING" }, "description": "7 suggested songs that are highly similar in genre and vibe. Format: 'Artist - Song Title'." },
            lesserKnownSimilarSongs: { "type": "ARRAY", "items": { "type": "STRING" }, "description": "2 suggested songs from lesser-known or emerging artists, similar in genre and vibe. Format: 'Artist - Song Title'." },
            generalImprovements: { "type": "ARRAY", "items": { "type": "STRING" }, "description": "General suggestions for improving the track's mixability or flow (e.g., 'Consider shortening the intro for quicker mixing', 'Could benefit from a sharper EQ cut in the bass during transitions')." }
          },
          "required": ["suggestedGenre", "suggestedSubGenres", "suggestedMoods", "suggestedKey", "suggestedBPMRange", "suggestedEnergyLevel", "suggestedCuePoints", "harmonicMixingSuggestions", "highlySimilarSongs", "lesserKnownSimilarSongs", "generalImprovements"]
        }
      }
    };

    const apiKey = "AIzaSyDWOgy5E4ISsVKZjx1t7IHx-ibXpnZ3OY8"; // Canvas will automatically provide this at runtime in Canvas environment. For local testing, replace with your actual API key.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
        const jsonString = result.candidates[0].content.parts[0].text;
        try {
          setSuggestions(JSON.parse(jsonString));
        } catch (parseError) {
          console.error("Failed to parse API response JSON:", jsonString, parseError);
          setError("Received invalid response from AI. Please try again.");
          setSuggestions(null); 
        }
      } else {
        setError("No suggestions received from AI. Please refine your input.");
        setSuggestions(null); 
      }
    } catch (err) {
      console.error("Error fetching API suggestions:", err);
      setError(`Failed to get suggestions: ${err.message}. Please try again.`);
      setSuggestions(null); 
    } finally {
      setLoading(false);
    }
  };


  const getPlaylistIdeas = async () => {
    setPlaylistLoading(true);
    setPlaylistError('');
    setPlaylistIdeas([]); 

    if (!playlistTheme) {
      setPlaylistError("Please enter a theme, mood, or event for your playlist.");
      setPlaylistLoading(false);
      return;
    }

    const prompt = `
      Generate 3 creative and unique playlist ideas based on the following theme, mood, or event.
      For each idea, provide a catchy playlist name, a brief description of its vibe, a list of 3-5 indicative sub-genres or moods it would typically contain, AND a list of 3 illustrative song examples (Artist - Song Title) that perfectly capture the essence of the playlist's vibe and genre. These song examples are meant as starting points for the DJ to explore, not a definitive tracklist.

      Playlist Theme/Mood/Event: "${playlistTheme}"

      Provide output strictly in the JSON format defined by the schema.
    `;

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              playlistName: { "type": "STRING", "description": "A catchy and creative name for the playlist." },
              description: { "type": "STRING", "description": "A brief description of the playlist's vibe and purpose." },
              indicativeGenresMoods: { "type": "ARRAY", "items": { "type": "STRING" }, "description": "3-5 indicative sub-genres or moods that fit this playlist." },
              suggestedStartingSongs: { "type": "ARRAY", "items": { "type": "STRING" }, "description": "3 illustrative song examples (Artist - Song Title) that capture the playlist's essence." }
            },
            required: ["playlistName", "description", "indicativeGenresMoods", "suggestedStartingSongs"]
          }
        }
      }
    };

    const apiKey = "AIzaSyDWOgy5E4ISsVKZjx1t7IHx-ibXpnZ3OY8"; // Canvas will automatically provide this at runtime in Canvas environment. For local testing, replace with your actual API key.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
        const jsonString = result.candidates[0].content.parts[0].text;
        try {
          setPlaylistIdeas(Array.isArray(JSON.parse(jsonString)) ? JSON.parse(jsonString) : []); 
        } catch (parseError) {
          console.error("Failed to parse API response JSON:", jsonString, parseError);
          setPlaylistError("Received invalid response from AI. Please try again.");
          setPlaylistIdeas([]); 
        }
      } else {
        setPlaylistError("No playlist ideas received from AI. Please refine your theme.");
        setPlaylistIdeas([]); 
      }
    } catch (err) {
      console.error("Error fetching playlist ideas:", err);
      setPlaylistError(`Failed to get playlist ideas: ${err.message}. Please try again.`);
      setPlaylistIdeas([]); 
    } finally {
      setPlaylistLoading(false);
    }
  };

  const getSetlistBlueprint = async () => {
    setSetlistLoading(true);
    setSetlistError('');
    setSetlistBlueprint(null); 

    if (!eventDescription) {
      setSetlistError("Please describe the event for your setlist blueprint.");
      setSetlistLoading(false);
      return;
    }

    const prompt = `
      Generate a high-level setlist blueprint based on the following event description.
      Divide the set into logical segments (e.g., Warm-up, Build-up, Peak, Cool-down) with suggested durations, and for each segment, provide indicative genres/moods, a brief description of the energy arc, AND a list of 2 illustrative song examples (Artist - Song Title) that perfectly capture the essence of that segment's vibe and genre. Aim for a practical and inspiring structure.

      Event Description: "${eventDescription}"

      Provide output strictly in the JSON format defined by the schema.
    `;

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            setlistTitle: { "type": "STRING", "description": "A suggested title for the setlist blueprint." },
            overallVibe: { "type": "STRING", "description": "An overall description of the set's vibe." },
            segments: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { "type": "STRING", "description": "Name of the segment (e.g., 'Warm-up', 'Peak-time')." },
                  duration: { "type": "STRING", "description": "Suggested duration (e.g., '30 mins', '1 hour')." },
                  genresMoods: { "type": "ARRAY", "items": { "type": "STRING" }, "description": "Indicative genres and moods for this segment." },
                  energyArc: { "type": "STRING", "description": "Description of the energy progression in this segment." },
                  suggestedSongs: { "type": "ARRAY", "items": { "type": "STRING" }, "description": "2 illustrative song examples for this segment (Artist - Song Title)." }
                },
                required: ["name", "duration", "genresMoods", "energyArc", "suggestedSongs"]
              }
            }
          },
          required: ["setlistTitle", "overallVibe", "segments"]
        }
      }
    };

    const apiKey = "AIzaSyDWOgy5E4ISsVKZjx1t7IHx-ibXpnZ3OY8"; // Canvas will automatically provide this at runtime in Canvas environment. For local testing, replace with your actual API key.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
        const jsonString = result.candidates[0].content.parts[0].text;
        try {
          setSetlistBlueprint(JSON.parse(jsonString)); 
        } catch (parseError) {
          console.error("Failed to parse API response JSON:", jsonString, parseError);
          setSetlistError("Received invalid response from AI. Please try again.");
          setSetlistBlueprint(null); 
        }
      } else {
        setSetlistError("No setlist blueprint received from AI. Please refine your event description.");
        setSetlistBlueprint(null); 
      }
    } catch (err) {
      console.error("Error fetching setlist blueprint:", err);
      setSetlistError(`Failed to get setlist blueprint: ${err.message}. Please try again.`);
      setSetlistBlueprint(null); 
    } finally {
      setSetlistLoading(false);
    }
  };

  const getGenreFusionSuggestions = async () => {
    setFusionLoading(true);
    setFusionError('');
    setFusionIdeas(null); // Clear previous and hide output

    if (!genresToFuse) {
      setFusionError("Please enter genres or moods you want to fuse.");
      setFusionLoading(false);
      return;
    }

    const prompt = `
      You are an expert DJ and music theorist. Given the following genres or moods, generate a creative fusion concept.
      Provide:
      1. A catchy fusion name.
      2. A brief description of the unique vibe this fusion creates.
      3. Key musical elements to emphasize when blending these genres (e.g., rhythm, harmony, specific instruments).
      4. 2-3 conceptual "bridge" genres or sub-genres, and for each, provide 1 song example (Artist - Song Title) that helps illustrate that genre.
      5. 3 illustrative hypothetical track examples (Artist - Song Title) that embody this fusion.

      Genres/Moods to Fuse: "${genresToFuse}"

      Provide output strictly in the JSON format defined by the schema.
    `;

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            fusionName: { "type": "STRING", "description": "A catchy name for the genre fusion." },
            fusionVibe: { "type": "STRING", "description": "A description of the unique vibe created by this fusion." },
            keyElements: { "type": "ARRAY", "items": { "type": "STRING" }, "description": "Key musical elements to emphasize during blending." },
            bridgeGenres: { // Modified to be an array of objects
              "type": "ARRAY",
              "items": {
                "type": "OBJECT",
                "properties": {
                  "genreName": {"type": "STRING", "description": "Name of the bridge genre or sub-genre."},
                  "songExample": {"type": "STRING", "description": "1 song example for this bridge genre (Artist - Song Title)."}
                },
                "required": ["genreName", "songExample"]
              },
              "description": "2-3 conceptual bridge genres/sub-genres with a song example for each."
            },
            illustrativeTracks: { "type": "ARRAY", "items": { "type": "STRING" }, "description": "3 illustrative hypothetical track examples (Artist - Song Title)." }
          },
          required: ["fusionName", "fusionVibe", "keyElements", "bridgeGenres", "illustrativeTracks"]
        }
      }
    };

    const apiKey = "AIzaSyDWOgy5E4ISsVKZjx1t7IHx-ibXpnZ3OY8";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
        const jsonString = result.candidates[0].content.parts[0].text;
        try {
          setFusionIdeas(JSON.parse(jsonString));
        } catch (parseError) {
          console.error("Failed to parse API response JSON:", jsonString, parseError);
          setFusionError("Received invalid response from AI. Please try again.");
          setFusionIdeas(null);
        }
      } else {
        setFusionError("No fusion ideas received from AI. Please refine your input.");
        setFusionIdeas(null);
      }
    } catch (err) {
      console.error("Error fetching fusion ideas:", err);
      setFusionError(`Failed to get fusion ideas: ${err.message}. Please try again.`);
      setFusionIdeas(null);
    } finally {
      setFusionLoading(false);
    }
  };

  const getTrackStory = async () => {
    setTrackPerformanceGuideLoading(true); // Corrected: use trackPerformanceGuideLoading
    setTrackPerformanceGuideError('');    // Corrected: use trackPerformanceGuideError
    setTrackPerformanceGuideData(null);   // Corrected: use trackPerformanceGuideData

    if (!trackPerformanceGuideTitle || !trackPerformanceGuideArtist || !trackPerformanceGuideVibe) {
      setTrackPerformanceGuideError("Please fill in Track Title, Artist, and Vibe for the Track Performance Guide."); // Corrected
      setTrackPerformanceGuideLoading(false); // Corrected
      return;
    }

    const prompt = `
      As a seasoned DJ and music critic, provide a deep dive analysis and narrative for the following track.
      Focus on its ideal set placement and creative mixing ideas.

      Track Title: "${trackPerformanceGuideTitle}"
      Artist: "${trackPerformanceGuideArtist}"
      Core Vibe/Mood: "${trackPerformanceGuideVibe}"

      Provide output strictly in the JSON format defined by the schema.
    `;

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            trackName: { "type": "STRING", "description": "The name of the analyzed track." },
            artistName: { "type": "STRING", "description": "The artist of the analyzed track." },
            idealSetPlacement: { "type": "STRING", "description": "Description of the ideal position for this track in a DJ set (e.g., warm-up, peak-time, cooldown)." },
            creativeMixingIdeas: { "type": "ARRAY", "items": { "type": "STRING" }, "description": "Specific creative mixing techniques for this track (e.g., loop points, filter usage, vocal manipulation)." },
            keyLyricalThemes: { "type": "STRING", "description": "Inferred key lyrical themes if applicable and inferable from text." }
          },
          required: ["trackName", "artistName", "idealSetPlacement", "creativeMixingIdeas", "keyLyricalThemes"]
        }
      }
    };

    const apiKey = "AIzaSyDWOgy5E4ISsVKZjx1t7IHx-ibXpnZ3OY8";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
        const jsonString = result.candidates[0].content.parts[0].text;
        try {
          setTrackPerformanceGuideData(JSON.parse(jsonString)); // Corrected: set to trackPerformanceGuideData
        } catch (parseError) {
          console.error("Failed to parse API response JSON:", jsonString, parseError);
          setTrackPerformanceGuideError("Received invalid response from AI. Please try again."); // Corrected
          setTrackPerformanceGuideData(null); // Corrected
        }
      } else {
        setTrackPerformanceGuideError("No track story received from AI. Please refine your input."); // Corrected
        setTrackPerformanceGuideData(null); // Corrected
      }
    } catch (err) {
      console.error("Error fetching track story:", err);
      setTrackPerformanceGuideError(`Failed to get track story: ${err.message}. Please try again.`); // Corrected
      setTrackPerformanceGuideData(null); // Corrected
    } finally {
      setTrackPerformanceGuideLoading(false); // Corrected
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-indigo-900 text-white font-sans p-4 sm:p-6 lg:p-8">
      {/* Import Orbitron font from Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap" rel="stylesheet" />

      <div className="max-w-4xl mx-auto bg-gray-900 rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 border border-gray-800">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 text-center tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          MixMaster Mind
        </h1>
        <p className="text-center text-gray-400 mb-8 max-w-2xl mx-auto">
          Unleash the full potential of your music library. Get smart, automated insights for seamless organization and elevated mixing.
        </p>

        {/* Navigation Buttons (restored) */}
        <nav className="mb-10 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => scrollToSection(trackAnalyzerRef)}
            className="flex flex-col items-center py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-300 bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-500 focus:ring-opacity-50 text-white shadow-md"
          >
            Track Analyzer
            <span className="text-xs font-normal text-sky-100 opacity-80 mt-1">Get song insights</span>
          </button>
          <button
            onClick={() => scrollToSection(playlistCreatorRef)}
            className="flex flex-col items-center py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-300 bg-fuchsia-600 hover:bg-fuchsia-700 focus:outline-none focus:ring-4 focus:ring-fuchsia-500 focus:ring-opacity-50 text-white shadow-md"
          >
            Playlist Creator
            <span className="text-xs font-normal text-fuchsia-100 opacity-80 mt-1">Generate playlist ideas</span>
          </button>
          <button
            onClick={() => scrollToSection(setlistBlueprintRef)}
            className="flex flex-col items-center py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-300 bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500 focus:ring-opacity-50 text-white shadow-md"
          >
            Setlist Blueprint
            <span className="text-xs font-normal text-emerald-100 opacity-80 mt-1">Structure your live sets</span>
          </button>
          <button
            onClick={() => scrollToSection(genreFusionRef)}
            className="flex flex-col items-center py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-300 bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50 text-white shadow-md"
          >
            Genre Fusion
            <span className="text-xs font-normal text-purple-100 opacity-80 mt-1">Blend genres creatively</span>
          </button>
          <button
            onClick={() => scrollToSection(trackPerformanceRef)} 
            className="flex flex-col items-center py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-300 bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-500 focus:ring-opacity-50 text-white shadow-md"
          >
            Track Performance
            <span className="text-xs font-normal text-rose-100 opacity-80 mt-1">Deep dive song analysis</span>
          </button>
        </nav>


        {/* Track Analyzer Section */}
        <div ref={trackAnalyzerRef} className="bg-gray-800 p-6 rounded-3xl shadow-inner border border-gray-700 mb-10">
          <h2 className="text-3xl font-bold text-white mb-6 text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Track Analyzer
          </h2>
          <p className="text-center text-gray-400 mb-8 max-w-xl mx-auto">
            Unlock the hidden potential of any track in your collection. Our advanced system analyzes your chosen song to provide intelligent insights, refine its categorization, identify optimal mixing points, and uncover a curated selection of highly compatible tracks – including unique hidden gems from emerging artists. Elevate your sets with precision and discovery.
          </p>

          {/* Input Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label htmlFor="trackTitle" className="block text-gray-300 text-sm font-bold mb-2">Track Title <span className="text-red-400">*</span></label>
              <input
                type="text"
                id="trackTitle"
                value={trackTitle}
                onChange={(e) => setTrackTitle(e.target.value)}
                placeholder="e.g., Starlight"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-white placeholder-gray-500 shadow-inner"
              />
            </div>
            <div>
              <label htmlFor="artist" className="block text-gray-300 text-sm font-bold mb-2">Artist <span className="text-red-400">*</span></label>
              <input
                type="text"
                id="artist"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="e.g., Muse"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-white placeholder-gray-500 shadow-inner"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="songSourceContext" className="block text-gray-300 text-sm font-bold mb-2">Song Source/Context (Optional)</label>
              <textarea
                id="songSourceContext"
                value={songSourceContext}
                onChange={(e) => setSongSourceContext(e.target.value)}
                rows="2"
                placeholder="e.g., YouTube URL: https://www.youtube.com/watch?v=starlight; or 'Found on Beatport, 'Progressive Hits May 2025' chart.'"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-white placeholder-gray-500 resize-y shadow-inner"
              ></textarea>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="desiredVibe" className="block text-gray-300 text-sm font-bold mb-2">Desired Vibe/Mood <span className="text-red-400">*</span></label>
              <input
                type="text"
                id="desiredVibe"
                value={desiredVibe}
                onChange={(e) => setDesiredVibe(e.target.value)}
                placeholder="Be specific. e.g., Energetic peak-time anthem; Chill, reflective after-hours groove"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-white placeholder-gray-500 shadow-inner"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-gray-300 text-sm font-bold mb-2">Specific Notes/Problems (Optional)</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                placeholder="e.g., Long intro, need a quicker mix-in point; vocal is a bit muddy."
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-white placeholder-gray-500 resize-y shadow-inner"
              ></textarea>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={getTrackAnalysisSuggestions}
              disabled={loading || !trackTitle || !artist || !desiredVibe}
              className={`w-full py-3 px-6 rounded-xl text-lg font-semibold transition-all duration-300
                ${loading ? 'bg-teal-700 cursor-not-allowed' : 'bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-400 focus:ring-opacity-50'}
                text-white shadow-lg transform hover:scale-105`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Track...
                </span>
              ) : (
                'Get Track Suggestions'
              )}
            </button>
            <button
              onClick={handleClearTrackAnalysis}
              className={`w-full py-3 px-6 rounded-xl text-lg font-semibold transition-all duration-300
                bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50
                text-white shadow-lg transform hover:scale-105`}
            >
              Clear Track Data
            </button>
          </div>

          {error && (
            <div className="mt-8 bg-red-900 bg-opacity-30 border border-red-700 text-red-200 p-4 rounded-lg shadow-inner">
              <p>Error: {error}</p>
            </div>
          )}

          {suggestions && ( // Only render suggestions if suggestions object is not null
            <div className="mt-8 bg-gray-800 p-6 rounded-3xl shadow-inner border border-gray-700">
              <h2 className="text-3xl font-bold text-white mb-6 text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>Suggestions for "{trackTitle}"</h2>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Inferred Genre */}
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-inner">
                  <h3 className="text-xl font-semibold text-sky-400 mb-2">Inferred Genre</h3>
                  <p className="text-lg text-white">**Primary:** {suggestions.suggestedGenre}</p>
                  {Array.isArray(suggestions.suggestedSubGenres) && suggestions.suggestedSubGenres.length > 0 && (
                    <p className="text-gray-400">**Sub-Genres:** {suggestions.suggestedSubGenres.join(', ')}</p>
                  )}
                </div>

                {/* Suggested Moods/Vibes */}
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-inner">
                  <h3 className="text-xl font-semibold text-sky-400 mb-2">Suggested Moods/Vibes</h3>
                  {Array.isArray(suggestions.suggestedMoods) && suggestions.suggestedMoods.length > 0 ? (
                    <p className="text-gray-400">{suggestions.suggestedMoods.join(', ')}</p>
                  ) : (
                    <p className="text-gray-400">No moods suggested.</p>
                  )}
                </div>

                {/* Inferred Key & BPM */}
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-inner">
                  <h3 className="text-xl font-semibold text-sky-400 mb-2">Inferred Key & BPM</h3>
                  <p className="text-white">**Inferred Key:** {suggestions.suggestedKey}</p>
                  <p className="text-white">**Inferred BPM Range:** {suggestions.suggestedBPMRange}</p>
                </div>

                {/* Energy Level */}
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-inner">
                  <h3 className="text-xl font-semibold text-sky-400 mb-2">Suggested Energy Level</h3>
                  <p className="text-gray-400">{suggestions.suggestedEnergyLevel}</p>
                </div>
              </div>

              {/* Highly Similar Songs */}
              <div className="mt-6 bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-inner">
                <h3 className="text-xl font-semibold text-lime-400 mb-2">Highly Similar Songs (Genre & Vibe Match)</h3>
                {Array.isArray(suggestions.highlySimilarSongs) && suggestions.highlySimilarSongs.length > 0 ? (
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {suggestions.highlySimilarSongs.map((song, index) => (
                      <li key={index}>{song}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No highly similar songs suggested at this time.</p>
                )}
              </div>

              {/* Hidden Gems (Lesser-Known Artists) */}
              <div className="mt-6 bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-inner">
                <h3 className="text-xl font-semibold text-purple-400 mb-2">Hidden Gems (Lesser-Known Artists)</h3>
                {Array.isArray(suggestions.lesserKnownSimilarSongs) && suggestions.lesserKnownSimilarSongs.length > 0 ? (
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {suggestions.lesserKnownSimilarSongs.map((song, index) => (
                      <li key={index}>{song}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No lesser-known similar songs suggested at this time.</p>
                )}
              </div>

              {/* Cue Points */}
              <div className="mt-6 bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-inner">
                <h3 className="text-xl font-semibold text-sky-400 mb-2">Suggested Cue Points</h3>
                {Array.isArray(suggestions.suggestedCuePoints) && suggestions.suggestedCuePoints.length > 0 ? (
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {suggestions.suggestedCuePoints.map((cue, index) => (
                      <li key={index}>{cue.description}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No specific cue point suggestions at this time.</p>
                )}
              </div>

              {/* Harmonic Mixing */}
              <div className="mt-6 bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-inner">
                <h3 className="text-xl font-semibold text-sky-400 mb-2">Harmonic Mixing Suggestions</h3>
                {Array.isArray(suggestions.harmonicMixingSuggestions) && suggestions.harmonicMixingSuggestions.length > 0 ? (
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {suggestions.harmonicMixingSuggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No specific harmonic mixing suggestions at this time.</p>
                )}
              </div>

              {/* General Improvements */}
              <div className="mt-6 bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-inner">
                <h3 className="text-xl font-semibold text-sky-400 mb-2">General Improvements</h3>
                {Array.isArray(suggestions.generalImprovements) && suggestions.generalImprovements.length > 0 ? (
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {suggestions.generalImprovements.map((improvement, index) => (
                      <li key={index}>{improvement}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No general improvement suggestions at this time.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Smart Playlist Creator Section */}
        <div ref={playlistCreatorRef} className="bg-gray-800 p-6 rounded-3xl shadow-inner border border-gray-700 mt-10">
          <h2 className="text-3xl font-bold text-white mb-6 text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Smart Playlist Creator
          </h2>
          <p className="text-center text-gray-400 mb-8 max-w-xl mx-auto">
            Stuck on a playlist idea? Enter a theme, mood, or event, and get creative playlist *concepts* (names, vibes, genres) and **illustrative song examples** to kickstart your curation. This tool does not generate full song tracklists.
          </p>

          <div className="mb-6">
            <label htmlFor="playlistTheme" className="block text-gray-300 text-sm font-bold mb-2">Playlist Theme, Mood, or Event <span className="text-red-400">*</span></label>
            <input
              type="text"
              id="playlistTheme"
              value={playlistTheme}
              onChange={(e) => setPlaylistTheme(e.target.value)}
              placeholder="e.g., Chill Sunday brunch; High-energy gym workout; Retro 80s dance party"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500 shadow-inner"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={getPlaylistIdeas}
              disabled={playlistLoading || !playlistTheme}
              className={`w-full py-3 px-6 rounded-xl text-lg font-semibold transition-all duration-300
                ${playlistLoading ? 'bg-purple-700 cursor-not-allowed' : 'bg-purple-500 hover:bg-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-50'}
                text-white shadow-lg transform hover:scale-105`}
            >
              {playlistLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Ideas...
                </span>
              ) : (
                'Generate Playlist Ideas'
              )}
            </button>
            <button
              onClick={handleClearPlaylistCreator}
              className={`w-full py-3 px-6 rounded-xl text-lg font-semibold transition-all duration-300
                bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50
                text-white shadow-lg transform hover:scale-105`}
            >
              Clear Playlist Data
            </button>
          </div>

          {playlistError && (
            <div className="mt-8 bg-red-900 bg-opacity-30 border border-red-700 text-red-200 p-4 rounded-lg shadow-inner">
              <p>Error: {playlistError}</p>
            </div>
          )}

          {Array.isArray(playlistIdeas) && playlistIdeas.length > 0 && ( // Only render if playlistIdeas is an array and has items
            <div className="mt-8 bg-gray-900 p-6 rounded-3xl shadow-inner border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-4 text-center">Your Playlist Concepts</h3>
              <div className="space-y-6">
                {playlistIdeas.map((idea, index) => (
                  <div key={index} className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-md">
                    <h4 className="text-xl font-semibold text-fuchsia-400 mb-2">{idea.playlistName}</h4>
                    <p className="text-gray-300 mb-2">{idea.description}</p>
                    <p className="text-sm text-gray-400">
                      **Vibes/Genres:** {Array.isArray(idea.indicativeGenresMoods) ? idea.indicativeGenresMoods.join(', ') : 'N/A'}
                    </p>
                    {Array.isArray(idea.suggestedStartingSongs) && idea.suggestedStartingSongs.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-gray-300">Starting Point Songs:</p>
                        <ul className="list-disc list-inside text-gray-400 text-sm">
                          {idea.suggestedStartingSongs.map((song, songIndex) => (
                            <li key={songIndex}>{song}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Setlist Blueprint Section */}
        <div ref={setlistBlueprintRef} className="bg-gray-800 p-6 rounded-3xl shadow-inner border border-gray-700 mt-10">
          <h2 className="text-3xl font-bold text-white mb-6 text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Setlist Blueprint Generator
          </h2>
          <p className="text-center text-gray-400 mb-8 max-w-xl mx-auto">
            Plan your next DJ set with an intelligent, structured blueprint. Define your event, and get a tailored flow of segments, durations, and vibes.
          </p>

          <div className="mb-6">
            <label htmlFor="eventDescription" className="block text-gray-300 text-sm font-bold mb-2">Describe Your Event <span className="text-red-400">*</span></label>
            <textarea
              id="eventDescription"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              rows="3"
              placeholder="e.g., 3-hour wedding reception, diverse age range, starting with dinner music, ending with dancing; or '1-hour warm-up set for a techno club, aiming for a deep, progressive feel.'"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500 resize-y shadow-inner"
              required
            ></textarea>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={getSetlistBlueprint}
              disabled={setlistLoading || !eventDescription}
              className={`w-full py-3 px-6 rounded-xl text-lg font-semibold transition-all duration-300
                ${setlistLoading ? 'bg-cyan-700 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-600 focus:outline-none focus:ring-4 focus:ring-cyan-400 focus:ring-opacity-50'}
                text-white shadow-lg transform hover:scale-105`}
            >
              {setlistLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Blueprint...
                </span>
              ) : (
                'Generate Setlist Blueprint'
              )}
            </button>
            <button
              onClick={handleClearSetlistBlueprint}
              className={`w-full py-3 px-6 rounded-xl text-lg font-semibold transition-all duration-300
                bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50
                text-white shadow-lg transform hover:scale-105`}
            >
              Clear Setlist Data
            </button>
          </div>

          {setlistError && (
            <div className="mt-8 bg-red-900 bg-opacity-30 border border-red-700 text-red-200 p-4 rounded-lg shadow-inner">
              <p>Error: {setlistError}</p>
            </div>
          )}

          {setlistBlueprint && ( // Only render if setlistBlueprint object is not null
            <div className="mt-8 bg-gray-900 p-6 rounded-3xl shadow-inner border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-4 text-center">{setlistBlueprint.setlistTitle}</h3>
              <p className="text-gray-300 mb-6 text-center">{setlistBlueprint.overallVibe}</p>
              <div className="space-y-6">
                {Array.isArray(setlistBlueprint.segments) && setlistBlueprint.segments.length > 0 ? (
                  setlistBlueprint.segments.map((segment, index) => (
                    <div key={index} className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-md">
                      <h4 className="text-xl font-semibold text-emerald-400 mb-2">{segment.name} ({segment.duration})</h4>
                      <p className="text-gray-300 mb-2">{segment.energyArc}</p>
                      <p className="text-sm text-gray-400">
                        **Genres/Moods:** {Array.isArray(segment.genresMoods) ? segment.genresMoods.join(', ') : 'N/A'}
                      </p>
                      {Array.isArray(segment.suggestedSongs) && segment.suggestedSongs.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-gray-300">Suggested Songs:</p>
                          <ul className="list-disc list-inside text-gray-400 text-sm">
                            {segment.suggestedSongs.map((song, songIndex) => (
                              <li key={songIndex}>{song}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No setlist segments generated.</p>
                )}
              </div>
              {/* Notice for Setlist Blueprint */}
              <div className="mt-6 p-4 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 text-sm italic shadow-inner">
                <p>
                  **Note on Setlist Timings:** This blueprint provides a strategic framework. Actual segment durations and transitions should always be dynamically adjusted in real-time based on the crowd's energy, responsiveness, and the unique flow of your live performance.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* NEW: Genre Fusion Suggestor Section */}
        <div ref={genreFusionRef} className="bg-gray-800 p-6 rounded-3xl shadow-inner border border-gray-700 mt-10">
          <h2 className="text-3xl font-bold text-white mb-6 text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Genre Fusion Suggestor
          </h2>
          <p className="text-center text-gray-400 mb-8 max-w-xl mx-auto">
            Break boundaries! Get creative ideas for blending two or more genres, including key elements, bridge genres, and illustrative track examples.
          </p>

          <div className="mb-6">
            <label htmlFor="genresToFuse" className="block text-gray-300 text-sm font-bold mb-2">Genres/Moods to Fuse <span className="text-red-400">*</span></label>
            <input
              type="text"
              id="genresToFuse"
              value={genresToFuse}
              onChange={(e) => setGenresToFuse(e.target.value)}
              placeholder="e.g., Techno & Jazz; Lo-Fi Hip Hop & Classical; Synthwave & Funk"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500 shadow-inner"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={getGenreFusionSuggestions}
              disabled={fusionLoading || !genresToFuse}
              className={`w-full py-3 px-6 rounded-xl text-lg font-semibold transition-all duration-300
                ${fusionLoading ? 'bg-purple-700 cursor-not-allowed' : 'bg-purple-500 hover:bg-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-50'}
                text-white shadow-lg transform hover:scale-105`}
            >
              {fusionLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Fusion...
                </span>
              ) : (
                'Generate Fusion Ideas'
              )}
            </button>
            <button
              onClick={handleClearGenreFusion}
              className={`w-full py-3 px-6 rounded-xl text-lg font-semibold transition-all duration-300
                bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50
                text-white shadow-lg transform hover:scale-105`}
            >
              Clear Fusion Data
            </button>
          </div>

          {fusionError && (
            <div className="mt-8 bg-red-900 bg-opacity-30 border border-red-700 text-red-200 p-4 rounded-lg shadow-inner">
              <p>Error: {fusionError}</p>
            </div>
          )}

          {fusionIdeas && ( // Only render if fusionIdeas is not null
            <div className="mt-8 bg-gray-900 p-6 rounded-3xl shadow-inner border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-4 text-center">Fusion Concept: {fusionIdeas.fusionName}</h3>
              <p className="text-gray-300 mb-6 text-center">{fusionIdeas.fusionVibe}</p>
              <div className="space-y-6">
                <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-md">
                  <h4 className="text-xl font-semibold text-purple-400 mb-2">Key Blending Elements:</h4>
                  {Array.isArray(fusionIdeas.keyElements) && fusionIdeas.keyElements.length > 0 ? (
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      {fusionIdeas.keyElements.map((element, index) => (
                        <li key={index}>{element}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400">No key elements suggested.</p>
                  )}
                </div>
                <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-md">
                  <h4 className="text-xl font-semibold text-purple-400 mb-2">Bridge Genres/Sub-Genres:</h4>
                  {Array.isArray(fusionIdeas.bridgeGenres) && fusionIdeas.bridgeGenres.length > 0 ? (
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      {fusionIdeas.bridgeGenres.map((bridge, index) => ( 
                        <li key={index}>{bridge.genreName} <span className="text-xs italic">({bridge.songExample})</span></li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400">No bridge genres suggested.</p>
                  )}
                </div>
                <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-md">
                  <h4 className="text-xl font-semibold text-purple-400 mb-2">Illustrative Track Examples:</h4>
                  {Array.isArray(fusionIdeas.illustrativeTracks) && fusionIdeas.illustrativeTracks.length > 0 ? (
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      {fusionIdeas.illustrativeTracks.map((track, index) => (
                        <li key={index}>{track}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400">No illustrative tracks suggested.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Track Performance Guide Section (formerly Track Storyteller & Deep Dive) */}
        <div ref={trackPerformanceRef} className="bg-gray-800 p-6 rounded-3xl shadow-inner border border-gray-700 mt-10">
          <h2 className="text-3xl font-bold text-white mb-6 text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Track Performance Guide
          </h2>
          <p className="text-center text-gray-400 mb-8 max-w-xl mx-auto">
            Uncover the ideal mixing potential of any track. Get a detailed analysis of its best set placement and creative mixing techniques.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label htmlFor="storyTrackTitle" className="block text-gray-300 text-sm font-bold mb-2">Track Title <span className="text-red-400">*</span></label>
              <input
                type="text"
                id="storyTrackTitle"
                value={trackPerformanceGuideTitle} 
                onChange={(e) => setTrackPerformanceGuideTitle(e.target.value)} 
                placeholder="e.g., Blue Monday"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-white placeholder-gray-500 shadow-inner"
                required
              />
            </div>
            <div>
              <label htmlFor="storyArtist" className="block text-gray-300 text-sm font-bold mb-2">Artist <span className="text-red-400">*</span></label>
              <input
                type="text"
                id="storyArtist"
                value={trackPerformanceGuideArtist} 
                onChange={(e) => setTrackPerformanceGuideArtist(e.target.value)} 
                placeholder="e.g., New Order"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-white placeholder-gray-500 shadow-inner"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="storyVibe" className="block text-gray-300 text-sm font-bold mb-2">Core Vibe/Genre <span className="text-red-400">*</span></label>
              <input
                type="text"
                id="storyVibe"
                value={trackPerformanceGuideVibe} 
                onChange={(e) => setTrackPerformanceGuideVibe(e.target.value)} 
                placeholder="e.g., Dark, driving synth-pop; Euphoric Trance anthem"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-white placeholder-gray-500 shadow-inner"
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={getTrackStory}
              disabled={trackPerformanceGuideLoading || !trackPerformanceGuideTitle || !trackPerformanceGuideArtist || !trackPerformanceGuideVibe} 
              className={`w-full py-3 px-6 rounded-xl text-lg font-semibold transition-all duration-300
                ${trackPerformanceGuideLoading ? 'bg-rose-700 cursor-not-allowed' : 'bg-rose-500 hover:bg-rose-600 focus:outline-none focus:ring-4 focus:ring-rose-400 focus:ring-opacity-50'}
                text-white shadow-lg transform hover:scale-105`}
            >
              {trackPerformanceGuideLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Guide...
                </span>
              ) : (
                'Get Track Performance Guide'
              )}
            </button>
            <button
              onClick={handleClearTrackPerformanceGuide} 
              className={`w-full py-3 px-6 rounded-xl text-lg font-semibold transition-all duration-300
                bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50
                text-white shadow-lg transform hover:scale-105`}
            >
              Clear Guide Data
            </button>
          </div>

          {trackPerformanceGuideError && (
            <div className="mt-8 bg-red-900 bg-opacity-30 border border-red-700 text-red-200 p-4 rounded-lg shadow-inner">
              <p>Error: {trackPerformanceGuideError}</p>
            </div>
          )}

          {trackPerformanceGuideData && ( // Only render if trackPerformanceGuideData is not null
            <div className="mt-8 bg-gray-900 p-6 rounded-3xl shadow-inner border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-4 text-center">"{trackPerformanceGuideData.trackName}" by {trackPerformanceGuideData.artistName} - Performance Guide</h3>
              <div className="space-y-6">
                <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-md">
                  <h4 className="text-xl font-semibold text-rose-400 mb-2">Ideal Set Placement:</h4>
                  <p className="text-gray-300">{trackPerformanceGuideData.idealSetPlacement}</p>
                </div>
                {Array.isArray(trackPerformanceGuideData.creativeMixingIdeas) && trackPerformanceGuideData.creativeMixingIdeas.length > 0 && (
                  <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-md">
                    <h4 className="text-xl font-semibold text-rose-400 mb-2">Creative Mixing Ideas:</h4>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      {trackPerformanceGuideData.creativeMixingIdeas.map((idea, index) => (
                        <li key={index}>{idea}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {trackPerformanceGuideData.keyLyricalThemes && (
                  <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-md">
                    <h4 className="text-xl font-semibold text-rose-400 mb-2">Key Lyrical Themes:</h4>
                    <p className="text-gray-300">{trackPerformanceGuideData.keyLyricalThemes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
