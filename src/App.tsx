import React, { useEffect, useState } from 'react';

import {
  Container, ThemeProvider, Theme, createStyles, makeStyles, createMuiTheme,
} from '@material-ui/core';
import { zhCN } from '@material-ui/core/locale';

import {
  ErrorMessage, LoginUser, NewNote, Note, User,
} from './types';
import loginService from './services/login';
import noteService from './services/note';
import { toUser } from './utils';

import ApplicationBar from './components/ApplicationBar';
import Login from './components/Login';
import ErrorDialog from './components/ErrorDialog';
import Notes from './components/Notes';
import NewFab from './components/NewFab';
import NoteForm from './components/NoteForm';

const theme = createMuiTheme({}, zhCN);
const useStyles = makeStyles((t: Theme) => createStyles({
  appBarSpacer: t.mixins.toolbar,
  fabSpacer: {
    height: t.spacing(11),
  },
}));

const App = () => {
  const classes = useStyles();

  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | null>(null);

  const handleLogin = (loginUser: LoginUser) => (
    loginService.login(loginUser)
      .then((u) => setUser(u))
  );

  const handleLogout = () => {
    localStorage.removeItem('user');
    noteService.clearToken();
    setUser(null);
  };

  const handleNoteCreate = (newNote: NewNote) => (
    noteService.add(newNote)
      .then((returnedNote) => setNotes(notes.concat(returnedNote)))
  );

  const handleNoteUpdate = (id: string, newNote: NewNote) => (
    noteService.update(id, newNote)
      .then((returnedNote) => setNotes(
        notes.map((note) => (note.id === id ? returnedNote : note)),
      ))
  );

  const handleNoteDelete = (id: string) => (
    noteService.remove(id)
      .then(() => setNotes(notes.filter((n) => n.id !== id)))
  );

  useEffect(() => {
    if (user !== null) {
      localStorage.setItem('user', JSON.stringify(user));
      noteService.setToken(user.token);
      noteService.getAll().then((n) => setNotes(n));
    } else {
      const cacheUser = localStorage.getItem('user');

      if (cacheUser !== null) {
        const parsedUser = toUser(JSON.parse(cacheUser));
        setUser(parsedUser);
        noteService.setToken(parsedUser.token);
        noteService.getAll().then((n) => setNotes(n));
      } else {
        setNotes([]);
      }
    }
  }, [user]);

  return (
    <ThemeProvider theme={theme}>
      <ApplicationBar
        handleLogout={handleLogout}
        displayName={user === null ? null : user.name}
        showLogin={() => setShowLogin(true)}
      />

      <Login
        display={showLogin}
        hideDialog={() => setShowLogin(false)}
        login={handleLogin}
        setErrorMessage={setErrorMessage}
      />

      {/* TODO: abstract to show more type of message */}
      <ErrorDialog
        message={errorMessage}
        hideDialog={() => setErrorMessage(null)}
      />

      <NoteForm
        display={showNoteForm}
        createNote={handleNoteCreate}
        hideDialog={() => setShowNoteForm(false)}
        setErrorMessage={setErrorMessage}
      />

      <div className={classes.appBarSpacer} />
      <Container component="main">
        {notes.length === 0
          ? (
            <>
              {/* TODO: display a user guide */}
              <div>点击右下角的按钮，开始记录您的第一条便签！</div>
            </>
          )
          : (
            <Notes
              notes={notes}
              updateNote={handleNoteUpdate}
              deleteNote={handleNoteDelete}
              setErrorMessage={setErrorMessage}
            />
          )}

        <div className={classes.fabSpacer} />
      </Container>

      {/* TODO: we might use router later */}
      {user === null ? null : <NewFab showNoteForm={() => setShowNoteForm(true)} />}
    </ThemeProvider>
  );
};

export default App;
