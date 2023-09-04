import React from "react";
import { Box, Card, Typography } from "@mui/material";
import { config } from "../config";
import { useMutation, useQueryClient } from "react-query";
import { savePost, deletePost, hidePost } from "../reactQuery/mutation";
import { useSelector } from "react-redux";

const PostOptions = ({ postId, saved, owner, hide, pageName, setOption }) => {
  const auth = useSelector((state) => state.auth.user);
  const queryClient = useQueryClient();
  // mutations
  const savePostMutation = useMutation({
    mutationFn: (body) => savePost(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries(["savedPosts"]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (body) => deletePost(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries(["posts", "userPhotos", "userPosts"]);
    },
  });

  const hideMutation = useMutation({
    mutationFn: (body) => hidePost(body),
    onSuccess: async (queryKey, body) => {
      queryClient.setQueriesData(["posts"], (oldData) => {
        console.log("pageName", pageName);
        if (body.hide) {
          const newData = oldData.filter((item) => item._id !== body.postId);
          return newData;
        } else {
          return oldData;
        }
      });
      queryClient.invalidateQueries(["posts", "userPosts"]);
    },
  });

  const onHover = {
    backgroundColor: "#218DFA",
    fontSize: "1rem",
    color: "white",
    zIndex: 2000,
  };
  return (
    <Card
      sx={{
        padding: "1rem 0.5rem",
        borderRadius: "0.3rem",
      }}
      raised
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          //   mt: "1rem",
          gap: "0.4rem",
          width: "100%",
        }}
      >
        {config.postOptions.map((item) => {
          if (saved) {
            if (item.name === "savePost") return;
          } else {
            if (item.name === "unsavePost") return;
          }

          if (pageName === "savePost") {
            if (
              item.name === "hidePost" ||
              item.name === "seePost" ||
              item.name === "delete"
            )
              return;
          }

          if (!owner) {
            if (
              item.name === "hidePost" ||
              item.name === "seePost" ||
              item.name === "delete"
            )
              return;
          } else {
            if (hide) {
              if (item.name === "hidePost") return;
            } else {
              if (item.name === "seePost") return;
            }
          }
          return (
            <Box
              component="a"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.6rem 1rem",
                // width: "20rem",
                borderRadius: "0.5rem",
                fontSize: "0.9rem",
                "&:hover": onHover,
              }}
              key={item.title}
              onClick={() => {
                if (item.name === "savePost" || item.name === "unsavePost") {
                  savePostMutation.mutate({
                    email: auth.email,
                    postId: postId,
                    saved: saved ? false : true,
                  });
                } else if (
                  item.name === "hidePost" ||
                  item.name === "seePost"
                ) {
                  hideMutation.mutate({
                    email: auth.email,
                    postId: postId,
                    hide: hide ? false : true,
                  });
                } else if (item.name === "delete") {
                  console.log("delete");
                  deleteMutation.mutate({
                    email: auth.email,
                    postId: postId,
                  });
                }
                setOption(false);
              }}
            >
              {item.icon}
              <Typography
                sx={{
                  fontWeight: 300,
                  font: "inherit",
                }}
              >
                {item.title}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Card>
  );
};

export default PostOptions;