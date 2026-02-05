"use client";

import type React from "react";
import { useState } from "react";
import { DragDropContext, type DropResult } from "react-beautiful-dnd";
import type { ListType, Card } from "@/types";
import List from "../List";
import TaskDetails from "../TaskDetails/TaskDetails";
import {
  addCard,
  updateCard,
  moveCard,
  archiveCard,
  deleteCard,
} from "@/utils/boardService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const CARD_LIMITS: Record<string, number> = {
  "Planning (To Do)": 7,
  "Monitoring (In Progress)": 4,
  "Controlling (Review)": 5,
  "Reflection (Done)": 10,
};

export default function BoardContent({
  lists,
  setLists,
  boardId,
  onCardMove,
}: {
  lists: ListType[];
  setLists: React.Dispatch<React.SetStateAction<ListType[]>>;
  boardId: string | null;
  onCardMove?: () => void;
}) {
  const [selectedCard, setSelectedCard] = useState<{
    listId: string;
    card: Card;
  } | null>(null);
  const [showNotesAlert, setShowNotesAlert] = useState(false);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [limitAlertInfo, setLimitAlertInfo] = useState<{
    columnName: string;
    limit: number;
  } | null>(null);
  const [pendingMove, setPendingMove] = useState<{
    source: any;
    destination: any;
  } | null>(null);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const destinationList = lists.find(
      (list) => list.id === destination.droppableId
    );

    if (source.droppableId !== destination.droppableId && destinationList) {
      const destinationTitle = destinationList.title;
      const cardLimit = CARD_LIMITS[destinationTitle];

      const activeCardsCount = destinationList.cards.filter(
        (card) => !card.archived && !card.deleted
      ).length;

      if (cardLimit !== undefined && activeCardsCount >= cardLimit) {
        setLimitAlertInfo({
          columnName: destinationTitle,
          limit: cardLimit,
        });
        setShowLimitAlert(true);
        // return; // Removed to allow soft limit behavior
      }
    }

    if (destinationList?.title === "Reflection (Done)") {
      const sourceList = lists.find((list) => list.id === source.droppableId);
      const card = sourceList?.cards[source.index];

      if (!card?.notes) {
        setPendingMove({ source, destination });
        setShowNotesAlert(true);
        return;
      }
    }

    moveCard(
      lists,
      setLists,
      boardId,
      source.index,
      destination.index,
      source.droppableId,
      destination.droppableId,
      onCardMove
    );
  };

  const handleNotesAlertConfirm = () => {
    if (pendingMove) {
      const { source, destination } = pendingMove;
      const sourceList = lists.find((list) => list.id === source.droppableId);
      const card = sourceList?.cards[source.index];
      if (card) {
        setSelectedCard({ listId: source.droppableId, card });
      }

      moveCard(
        lists,
        setLists,
        boardId,
        source.index,
        destination.index,
        source.droppableId,
        destination.droppableId,
        onCardMove
      );
    }
    setShowNotesAlert(false);
    setPendingMove(null);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex h-full">
        <div className="flex flex-grow gap-4 overflow-x-auto pb-4 px-1 scrollbar-thin scrollbar-thumb-indigo-300 dark:scrollbar-thumb-indigo-600 scrollbar-track-transparent bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM4QkE2Q0EiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTEyIDBoNnY2aC02di02em0xMiAwaDZ2NmgtNnYtNnptLTYgNmg2djZoLTZ2LTZ6bS02IDBoNnY2aC02di02em0xMiAwaDZ2NmgtNnYtNnptLTEyIDZoNnY2aC02di02em0wLTEyaDZ2LTZoLTZ2NnoiLz48L2c+PC9nPjwvc3ZnPg==')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNGRkZGRkYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTEyIDBoNnY2aC02di02em0xMiAwaDZ2NmgtNnYtNnptLTYgNmg2djZoLTZ2LTZ6bS02IDBoNnY2aC02di02em0xMiAwaDZ2NmgtNnYtNnptLTEyIDZoNnY2aC02di02em0wLTEyaDZ2LTZoLTZ2NnoiLz48L2c+PC9nPjwvc3ZnPg==')]">
          {lists.map((list) => (
            <List
              key={list.id}
              id={list.id}
              title={list.title}
              cards={list.cards.filter(
                (card) => !card.archived && !card.deleted
              )}
              isAddingCard={list.isAddingCard}
              onAddCard={(
                listId,
                courseCode,
                courseName,
                material,
                difficulty
              ) =>
                addCard(
                  lists,
                  setLists,
                  listId,
                  courseCode,
                  courseName,
                  material,
                  difficulty,
                  boardId
                )
              }
              onCardClick={(listId, card) => setSelectedCard({ listId, card })}
              onCancelAddCard={() => {
                const updatedLists = lists.map((l) =>
                  l.id === list.id ? { ...l, isAddingCard: false } : l
                );
                setLists(updatedLists);
              }}
              onShowLimitAlert={(columnName, limit) => {
                setLimitAlertInfo({ columnName, limit });
                setShowLimitAlert(true);
              }}
            />
          ))}
        </div>
      </div>

      {selectedCard && (
        <TaskDetails
          listName={
            lists.find((list) => list.id === selectedCard.listId)?.title || ""
          }
          boardId={boardId || ""}
          card={selectedCard.card}
          onClose={() => setSelectedCard(null)}
          onUpdateTitle={(id, value) =>
            updateCard(lists, setLists, boardId, id, "title", value)
          }
          onUpdateSubTitle={(id, value) =>
            updateCard(lists, setLists, boardId, id, "sub_title", value)
          }
          onUpdateDescription={(id, value) =>
            updateCard(lists, setLists, boardId, id, "description", value)
          }
          onUpdateDifficulty={(id, value) =>
            updateCard(lists, setLists, boardId, id, "difficulty", value)
          }
          onUpdatePriority={(id, value) =>
            updateCard(lists, setLists, boardId, id, "priority", value)
          }
          onUpdateLearningStrategy={(id, value) =>
            updateCard(lists, setLists, boardId, id, "learning_strategy", value)
          }
          onUpdateChecklists={(id, value) =>
            updateCard(lists, setLists, boardId, id, "checklists", value)
          }
          onUpdateLinks={(id, value) =>
            updateCard(lists, setLists, boardId, id, "links", value)
          }
          onUpdateRating={(id, value) =>
            updateCard(lists, setLists, boardId, id, "rating", value)
          }
          onUpdateNotes={(id, value) =>
            updateCard(lists, setLists, boardId, id, "notes", value)
          }
          onUpdatePreTestGrade={(id, value) =>
            updateCard(lists, setLists, boardId, id, "pre_test_grade", value)
          }
          onUpdatePostTestGrade={(id, value) =>
            updateCard(lists, setLists, boardId, id, "post_test_grade", value)
          }
          onArchive={(cardId) => {
            archiveCard(lists, setLists, boardId, cardId);
            setSelectedCard(null);
          }}
          onDelete={(cardId) => deleteCard(lists, setLists, boardId, cardId)}
        />
      )}

      <AlertDialog open={showNotesAlert} onOpenChange={setShowNotesAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notes Required</AlertDialogTitle>
            <AlertDialogDescription>
              Please add your learning notes/summary before moving this task to
              the Reflection column. This helps track your learning progress and
              understanding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowNotesAlert(false);
                setPendingMove(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleNotesAlertConfirm}>
              Add Notes Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Card Limit Exceeded Alert */}
      <AlertDialog open={showLimitAlert} onOpenChange={setShowLimitAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Card Limit Reached</AlertDialogTitle>
            <AlertDialogDescription>
              The <strong>{limitAlertInfo?.columnName}</strong> column has reached its maximum capacity of{" "}
              <strong>{limitAlertInfo?.limit} cards</strong>.
              <br /><br />
              Please complete or archive some tasks in this column before adding new ones.
              This limit helps you focus on manageable workload and promotes better self-regulated learning.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowLimitAlert(false);
                setLimitAlertInfo(null);
              }}
            >
              Understood
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DragDropContext>
  );
}
