import { Colors } from '@blueprintjs/core';
import { ActionIcon, Box, Divider, Flex, NavLink } from '@mantine/core';
import { FC, useState } from 'react';

const Sidebar: FC = () => {
    return (
        <>
            <Box
                component={Flex}
                bg={Colors.LIGHT_GRAY5}
                direction="column"
                justify="center"
                align="center"
                gap="xs"
                sx={{ width: 200 }}
            >
                <Box
                    component="img"
                    src="/lightdash-logo.png"
                    alt="lightdash logo"
                    width="100"
                />
                <NavLink
                    label="Neuralink"
                    icon={
                        <Box
                            component="img"
                            src="/neuralink.svg"
                            alt="neuralink"
                        />
                    }
                    rightSection={
                        <ActionIcon>
                            {/*DROPDOWN HERE*/}
                            <Box
                                component="img"
                                src="/chevron-selector-vertical.svg"
                                alt="chevron selector"
                            />
                        </ActionIcon>
                    }
                />
                <Divider my="xs" color={Colors.LIGHT_GRAY1} />
                <NavLink label="Link #2" />
                <NavLink label="Link #3" />
            </Box>
        </>
    );
};

export default Sidebar;
