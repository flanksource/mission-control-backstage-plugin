import React, { PropsWithChildren } from 'react';
import { makeStyles } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import CategoryIcon from '@material-ui/icons/Category';
import CreateComponentIcon from '@material-ui/icons/AddCircleOutline';
import {
  Sidebar,
  SidebarPage,
  SidebarItem,
  SidebarDivider,
  SidebarSpace,
  SidebarExpandButton,
  SidebarScrollWrapper,
} from '@backstage/core-components';
import { UserSettingsSignInAvatar } from '@backstage/plugin-user-settings';
import { useNavigate } from 'react-router-dom';

const useSidebarLogoStyles = makeStyles({
  root: {
    width: '100%',
    height: 3 * 9,
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    marginBottom: -14,
  },
  link: {
    width: '100%',
    marginLeft: 24,
    fontSize: 24,
    fontWeight: 700,
    textDecoration: 'none',
    color: 'inherit',
    cursor: 'pointer',
  },
});

function SidebarLogo() {
  const classes = useSidebarLogoStyles();
  const navigate = useNavigate();
  return (
    <div className={classes.root}>
      <div className={classes.link} onClick={() => navigate('/')}>
        MC
      </div>
    </div>
  );
}

export function Root({ children }: PropsWithChildren<{}>) {
  return (
    <SidebarPage>
      <Sidebar>
        <SidebarLogo />
        <SidebarDivider />
        <SidebarItem icon={HomeIcon} to="catalog" text="Home" />
        <SidebarItem icon={CategoryIcon} to="catalog" text="Catalog" />
        <SidebarItem icon={CreateComponentIcon} to="catalog-import" text="Import" />
        <SidebarDivider />
        <SidebarScrollWrapper />
        <SidebarSpace />
        <SidebarDivider />
        <SidebarItem icon={UserSettingsSignInAvatar} to="settings" text="Settings" />
        <SidebarExpandButton />
      </Sidebar>
      {children}
    </SidebarPage>
  );
}
