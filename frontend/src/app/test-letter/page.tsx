import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import AlertTitle from "@mui/material/AlertTitle";
import Alert from "@mui/material/Alert";
import FsMobileShell from "@/features/finger-spelling/components/shell/FsMobileShell";
import { fetchLetterData } from "@/features/finger-spelling/api/curriculum";
import MediaPreview from "./MediaPreview";

export default async function LetterTestPage() {
  // Fetch data for letter "ក"
  const letterData = await fetchLetterData("ក");

  if (!letterData) {
    return (
      <FsMobileShell title="Letter Test" subtitle="ក (Ka)" showBack>
        <Alert severity="error">
          <AlertTitle>Failed to Load Letter Data</AlertTitle>
          Could not fetch data for letter &quot;ក&quot; from the API. Please make sure
          the backend server is running at http://localhost:8000
        </Alert>
      </FsMobileShell>
    );
  }

  const { letter, lessons, units_and_chapters, medias_count } = letterData;

  return (
    <FsMobileShell title="Letter Test" subtitle="ក (Ka)" showBack>
      <Stack spacing={3}>
        {/* Letter Header */}
        <Paper elevation={1} sx={{ p: 2, backgroundColor: "#f5f5f5" }}>
          <Typography variant="h3" component="div" sx={{ mb: 1, fontWeight: "bold" }}>
            {letter.letter_kh}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {letter.letter_en} (Khmer: {letter.letter_kh})
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            ID: {letter.id} | Status: {letter.is_active ? "✅ Active" : "❌ Inactive"}
          </Typography>
        </Paper>

        {/* Success Message */}
        <Alert severity="success">
          <AlertTitle>✅ Letter Successfully Loaded</AlertTitle>
          The letter &quot;ក&quot; (Ka) has been successfully fetched from the backend API
          and {medias_count} media file{medias_count !== 1 ? "s" : ""} {medias_count !== 1 ? "are" : "is"} linked to it.
        </Alert>

        {/* Curriculum Path */}
        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1.5, fontWeight: "bold" }}>
            📚 Curriculum Path
          </Typography>
          {units_and_chapters.length > 0 ? (
            <Stack spacing={1}>
              {units_and_chapters.map((uc, idx) => (
                <Box key={idx}>
                  <Typography variant="body1">
                    <strong>Unit:</strong> {uc.unit.name_kh}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {uc.unit.name_en}
                  </Typography>
                  <Typography variant="body1" sx={{ ml: 2, mt: 0.5 }}>
                    <strong>→ Chapter:</strong> {uc.chapter.name_kh}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                    {uc.chapter.name_en}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary">No curriculum path found</Typography>
          )}
        </Paper>

        {/* Lessons */}
        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1.5, fontWeight: "bold" }}>
            📖 Lessons ({lessons.length})
          </Typography>
          {lessons.length > 0 ? (
            <Stack spacing={1}>
              {lessons.map((l, idx) => (
                <Box key={idx} sx={{ pb: 1, borderBottom: "1px solid #eee", "&:last-child": { borderBottom: "none" } }}>
                  <Typography variant="body1">
                    <strong>{l.lesson.name_kh}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {l.lesson.name_en}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    Chapter: {l.chapter.name_kh} ({l.chapter.name_en})
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    Unit: {l.unit.name_kh} ({l.unit.name_en})
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary">No lessons found</Typography>
          )}
        </Paper>

        {/* Media Files - Main Section */}
        <Paper elevation={2} sx={{ p: 3, backgroundColor: "#fafafa", border: "2px solid #4CAF50" }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold", color: "#2e7d32" }}>
            🖼️ Media Files ({medias_count})
          </Typography>
          {letter.medias && letter.medias.length > 0 ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Displaying {letter.medias.length} sign language image{letter.medias.length !== 1 ? "s" : ""} for the letter {letter.letter_kh}:
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                  },
                  gap: 2,
                }}
              >
                {letter.medias.map((media, idx) => (
                  <Paper key={media.id} elevation={2} sx={{ p: 1.5, textAlign: "center", height: "100%" }}>
                    <Box
                      sx={{
                        width: "100%",
                        height: "220px",
                        backgroundColor: "#f0f0f0",
                        borderRadius: 1,
                        mb: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        border: "1px solid #ddd",
                      }}
                    >
                      <MediaPreview
                        src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/curriculum/media/${media.id}`}
                        alt={`${letter.letter_kh} - Sign Language Image ${idx + 1}`}
                        fileUrl={media.file_url}
                      />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 0.5 }}>
                      Image #{idx + 1}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      Type: {media.media_type}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      ID: {media.id}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="primary"
                      sx={{ 
                        display: "block", 
                        mt: 1,
                        wordBreak: "break-all",
                        fontSize: "0.65rem",
                        maxHeight: "60px",
                        overflow: "auto",
                      }}
                    >
                      <strong>Path:</strong> {media.file_url}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </>
          ) : (
            <Typography color="text.secondary">
              No media files found for this letter
            </Typography>
          )}
        </Paper>

        {/* File Details */}
        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1.5, fontWeight: "bold" }}>
            📋 Media File Details
          </Typography>
          <Stack spacing={1}>
            {letter.medias && letter.medias.length > 0 ? (
              letter.medias.map((media, idx) => (
                <Box key={media.id} sx={{ pb: 1, borderBottom: "1px solid #eee", "&:last-child": { borderBottom: "none" } }}>
                  <Typography variant="body2">
                    <strong>File #{idx + 1}:</strong>
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", ml: 1, mt: 0.5 }}>
                    <strong>ID:</strong> {media.id}
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", ml: 1 }}>
                    <strong>Type:</strong> {media.media_type}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: "block",
                      ml: 1, 
                      wordBreak: "break-all",
                      fontFamily: "monospace",
                      backgroundColor: "#f5f5f5",
                      p: 0.5,
                      borderRadius: 0.5,
                    }}
                  >
                    <strong>Path:</strong> {media.file_url}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography color="text.secondary">No media files</Typography>
            )}
          </Stack>
        </Paper>

        {/* Raw JSON Response */}
        <Paper elevation={1} sx={{ p: 2, backgroundColor: "#f9f9f9" }}>
          <Typography variant="h6" sx={{ mb: 1.5, fontWeight: "bold" }}>
            📊 Raw API Response (JSON)
          </Typography>
          <Box
            component="pre"
            sx={{
              backgroundColor: "#f0f0f0",
              p: 1.5,
              borderRadius: 1,
              overflow: "auto",
              fontSize: "0.75rem",
              maxHeight: "400px",
              fontFamily: "monospace",
              border: "1px solid #ddd",
            }}
          >
            {JSON.stringify(letterData, null, 2)}
          </Box>
        </Paper>

        {/* Test Notes */}
        <Alert severity="info">
          <AlertTitle>ℹ️ Test Information</AlertTitle>
          <Typography variant="body2">
            This page demonstrates that the backend API is successfully:
          </Typography>
          <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
            <li>Fetching letter data from the database</li>
            <li>Linking media files to letters via the finger_letter_media junction table</li>
            <li>Serving media files through the /api/curriculum/media/{"{id}"} endpoint</li>
            <li>Returning complete curriculum hierarchy (unit → chapter → lesson → letter)</li>
          </ul>
          <Typography variant="caption" color="text.secondary">
            API URL: {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
          </Typography>
        </Alert>
      </Stack>
    </FsMobileShell>
  );
}
