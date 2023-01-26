import {
    Button,
    Classes,
    Menu,
    MenuDivider,
    PopoverPosition,
} from '@blueprintjs/core';
import { MenuItem2, Popover2, Tooltip2 } from '@blueprintjs/popover2';
import { Dashboard, DashboardTileTypes } from '@lightdash/common';
import React, { ReactNode, useState } from 'react';
import { TileModal } from '../TileForms/TileModal';
import {
    ButtonsWrapper,
    ChartContainer,
    HeaderContainer,
    HeaderWrapper,
    TileBaseWrapper,
    Title,
    TitleButton,
    TitleWrapper,
    TooltipContent,
} from './TileBase.styles';

type Props<T> = {
    isEditMode: boolean;
    title: string;
    titleHref: string;
    description?: string;
    hasDescription: boolean;
    tile: T;
    isLoading?: boolean;
    extraMenuItems?: React.ReactNode;
    onDelete: (tile: T) => void;
    onEdit: (tile: T) => void;
    children: ReactNode;
    extraHeaderElement?: React.ReactNode;
};

const TileBase = <T extends Dashboard['tiles'][number]>({
    isEditMode,
    title,
    description,
    tile,
    isLoading,
    extraMenuItems,
    onDelete,
    onEdit,
    children,
    extraHeaderElement,
    hasDescription,
    titleHref,
}: Props<T>) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    const hideTitle =
        tile.type !== DashboardTileTypes.MARKDOWN
            ? tile.properties.hideTitle
            : false;

    const hasTitle = hideTitle ? false : true;
    return (
        <TileBaseWrapper
            className={isLoading ? Classes.SKELETON : undefined}
            isEditMode={isEditMode}
            isHovering={isHovering}
            hasTitle={hasTitle}
        >
            <HeaderContainer
                isEditMode={isEditMode}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                hasTitle={hasTitle}
            >
                <HeaderWrapper>
                    {!hideTitle && description ? (
                        <Tooltip2
                            content={
                                <TooltipContent>{description}</TooltipContent>
                            }
                            position="bottom-left"
                        >
                            <TitleWrapper hasDescription={true}>
                                <TitleButton href={titleHref} target="_blank">
                                    <Title className="non-draggable">
                                        {title}
                                    </Title>
                                </TitleButton>
                            </TitleWrapper>
                        </Tooltip2>
                    ) : !hideTitle ? (
                        <TitleButton href={titleHref} target="_blank">
                            <TitleWrapper hasDescription={hasDescription}>
                                <Title className="non-draggable">{title}</Title>
                            </TitleWrapper>
                        </TitleButton>
                    ) : null}
                </HeaderWrapper>
                <ButtonsWrapper>
                    {extraHeaderElement}
                    {(isEditMode || (!isEditMode && extraMenuItems)) && (
                        <Popover2
                            className="non-draggable"
                            content={
                                <Menu>
                                    {extraMenuItems}
                                    {isEditMode && extraMenuItems && (
                                        <MenuDivider />
                                    )}
                                    {isEditMode && (
                                        <>
                                            <MenuItem2
                                                icon="edit"
                                                text="Edit tile content"
                                                onClick={() =>
                                                    setIsEditing(true)
                                                }
                                            />
                                            {tile.type !==
                                                DashboardTileTypes.MARKDOWN && (
                                                <MenuItem2
                                                    icon={
                                                        hideTitle
                                                            ? 'eye-open'
                                                            : 'eye-off'
                                                    }
                                                    text={`${
                                                        hideTitle
                                                            ? 'Show'
                                                            : 'Hide'
                                                    } title`}
                                                    onClick={() =>
                                                        onEdit({
                                                            ...tile,
                                                            properties: {
                                                                ...tile.properties,
                                                                hideTitle:
                                                                    !hideTitle,
                                                            },
                                                        })
                                                    }
                                                />
                                            )}
                                            <MenuDivider />
                                            <MenuItem2
                                                icon="delete"
                                                intent="danger"
                                                text="Remove tile"
                                                onClick={() => onDelete(tile)}
                                            />
                                        </>
                                    )}
                                </Menu>
                            }
                            position={PopoverPosition.BOTTOM_RIGHT}
                            lazy
                        >
                            <Button minimal icon="more" />
                        </Popover2>
                    )}
                </ButtonsWrapper>
            </HeaderContainer>
            <ChartContainer className="non-draggable cohere-block">
                {children}
            </ChartContainer>
            {isEditing && (
                <TileModal
                    onClose={() => setIsEditing(false)}
                    tile={tile}
                    onSubmit={onEdit}
                />
            )}
        </TileBaseWrapper>
    );
};

TileBase.defaultProps = {
    isLoading: false,
    extraMenuItems: null,
    description: null,
    hasDescription: false,
    hasFilters: false,
};

export default TileBase;
